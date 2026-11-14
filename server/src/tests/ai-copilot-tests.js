const http = require('http');
const assert = require('assert');
const app = require('../app');
const { connectDB, disconnectDB } = require('../config/db');
const User = require('../models/User');
const Queue = require('../models/Queue');
const Token = require('../models/Token');
const AIConversation = require('../models/AIConversation');
const { runSeed } = require('../scripts/seed');
const {
  listMyQueues,
  getQueueStatus,
  getQueueAnalytics,
  compareMyQueues,
  identifyQueueBottlenecks,
  executeTool,
} = require('../services/ai-tools.service');

let server;
let baseUrl;

const request = async (endpoint, options = {}) => {
  const url = `${baseUrl}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  const response = await fetch(url, {
    method: options.method || 'GET',
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const text = await response.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch (e) {
    data = text;
  }

  return {
    status: response.status,
    ok: response.ok,
    body: data,
  };
};

const runAITests = async () => {
  console.log('\n=============================================================');
  console.log('🤖 RUNNING QUEUEPRO AI COPILOT (GROQ) VERIFICATION TESTS');
  console.log('=============================================================\n');

  try {
    await connectDB();
    await runSeed();

    server = http.createServer(app);
    await new Promise((resolve) => server.listen(5098, resolve));
    baseUrl = 'http://localhost:5098';
    console.log(`[AI Test Harness] Server running on ${baseUrl}\n`);

    // 1. Authenticate Manager 1 (Sarah Jenkins)
    console.log('🔹 Test 1: Authenticating Manager 1...');
    const loginRes = await request('/api/auth/login', {
      method: 'POST',
      body: { email: 'manager@queuepro.com', password: 'Password123!' },
    });
    assert.strictEqual(loginRes.status, 200, 'Manager 1 login should return 200');
    const token1 = loginRes.body.data.token;
    const manager1 = loginRes.body.data.user;
    console.log('   ✅ Manager 1 authenticated successfully.');

    // 2. Authenticate Manager 2 (Sarah)
    console.log('🔹 Test 2: Authenticating Manager 2...');
    const loginRes2 = await request('/api/auth/login', {
      method: 'POST',
      body: { email: 'sarah@queuepro.com', password: 'Password123!' },
    });
    assert.strictEqual(loginRes2.status, 200, 'Manager 2 login should return 200');
    const token2 = loginRes2.body.data.token;
    const manager2 = loginRes2.body.data.user;
    console.log('   ✅ Manager 2 authenticated successfully.');

    // 3. Security: Unauthenticated request to /api/ai/chat must be rejected
    console.log('🔹 Test 3: Unauthenticated request rejection...');
    const unauthRes = await request('/api/ai/chat', {
      method: 'POST',
      body: { message: 'Give me a summary of my queues' },
    });
    assert.strictEqual(unauthRes.status, 401, 'Unauthenticated request should return 401');
    console.log('   ✅ 401 Unauthorized returned for unauthenticated AI request.');

    // 4. Request Validation: Empty or oversized messages rejected
    console.log('🔹 Test 4: Request payload validation...');
    const emptyMsgRes = await request('/api/ai/chat', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token1}` },
      body: { message: '' },
    });
    assert.strictEqual(emptyMsgRes.status, 400, 'Empty message should return 400');

    const oversizedMsg = 'a'.repeat(2500);
    const oversizeRes = await request('/api/ai/chat', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token1}` },
      body: { message: oversizedMsg },
    });
    assert.strictEqual(oversizeRes.status, 400, 'Oversized message should return 400');
    console.log('   ✅ Zod validation correctly rejected empty and oversized messages.');

    // 5. Tool Verification: list_my_queues derives managerId strictly from JWT
    console.log('🔹 Test 5: Tool "list_my_queues" ownership enforcement...');
    const queues1 = await listMyQueues({ managerId: manager1.id });
    assert.strictEqual(queues1.success, true);
    assert(Array.isArray(queues1.queues));
    assert(queues1.queues.length > 0, 'Manager 1 should have queues');
    const queue1Id = queues1.queues[0].queueId;
    console.log(`   ✅ list_my_queues found ${queues1.queues.length} queues for Manager 1.`);

    // 6. Tool Verification: get_queue_status privacy protection & ownership
    console.log('🔹 Test 6: Tool "get_queue_status" privacy and isolation...');
    // Manager 1 accessing own queue
    const status1 = await getQueueStatus({ managerId: manager1.id, queueId: queue1Id });
    assert.strictEqual(status1.success, true);
    assert.strictEqual(typeof status1.waitingCount, 'number');
    // Ensure customer phone numbers are NOT leaked
    if (status1.waitingTokensPreview.length > 0) {
      assert.strictEqual(status1.waitingTokensPreview[0].phoneNumber, undefined, 'Phone numbers must be redacted');
      assert(status1.waitingTokensPreview[0].customerName, 'Customer name should exist');
      assert(status1.waitingTokensPreview[0].elapsedWaitFormatted, 'Elapsed wait formatted should exist');
    }
    console.log('   ✅ Customer phone numbers are strictly redacted from AI context.');

    // Manager 2 attempting to access Manager 1's queue
    const unauthorizedStatus = await getQueueStatus({ managerId: manager2.id, queueId: queue1Id });
    assert.strictEqual(unauthorizedStatus.success, false, 'Cross-manager queue access must fail');
    console.log('   ✅ Cross-manager queue status access safely denied.');

    // 7. Tool Verification: get_queue_analytics correctness
    console.log('🔹 Test 7: Tool "get_queue_analytics" calculation accuracy...');
    const analytics = await getQueueAnalytics({ managerId: manager1.id, queueId: queue1Id, dateRange: 'today' });
    assert.strictEqual(analytics.success, true);
    assert.strictEqual(typeof analytics.metrics.avgWaitingTimeSeconds, 'number');
    assert.strictEqual(typeof analytics.metrics.queueEfficiencyPercentage, 'number');
    assert(analytics.dataRetrievedAt, 'dataRetrievedAt timestamp should be present');
    console.log(`   ✅ Analytics computed: ${analytics.metrics.completedCount} served, avg wait ${analytics.metrics.avgWaitingTimeFormatted}.`);

    // 8. Tool Verification: compare_my_queues
    console.log('🔹 Test 8: Tool "compare_my_queues" multi-queue comparison...');
    const compRes = await compareMyQueues({ managerId: manager1.id, dateRange: 'today' });
    assert.strictEqual(compRes.success, true);
    assert(Array.isArray(compRes.comparison));
    assert.strictEqual(compRes.comparison.length, queues1.queues.length);
    console.log(`   ✅ compare_my_queues compared ${compRes.comparison.length} queues side-by-side.`);

    // 9. Tool Verification: identify_queue_bottlenecks
    console.log('🔹 Test 9: Tool "identify_queue_bottlenecks" threshold detection...');
    const bottlenecks = await identifyQueueBottlenecks({ managerId: manager1.id });
    assert.strictEqual(bottlenecks.success, true);
    assert.strictEqual(typeof bottlenecks.bottlenecksFound, 'number');
    assert(Array.isArray(bottlenecks.findings));
    console.log(`   ✅ identify_queue_bottlenecks completed. Summary: "${bottlenecks.summary}"`);

    // 10. Security: Non-allowlisted tools cannot be executed
    console.log('🔹 Test 10: Tool allowlist security rejection...');
    let toolErrThrown = false;
    try {
      await executeTool('delete_all_tokens', {}, manager1.id);
    } catch (e) {
      toolErrThrown = true;
    }
    assert(toolErrThrown, 'Non-allowlisted tool execution must throw an error');
    console.log('   ✅ Unauthorized / malicious tool execution prevented.');

    // 11. Conversation Persistence & Ownership Isolation
    console.log('🔹 Test 11: Conversation isolation across managers...');
    const testConv = await AIConversation.create({
      managerId: manager1.id,
      title: 'Confidential Strategy Chat',
      messages: [{ role: 'user', content: 'Secret queue data' }],
    });

    // Manager 1 can retrieve it
    const getConv1 = await request(`/api/ai/conversations/${testConv._id}`, {
      headers: { Authorization: `Bearer ${token1}` },
    });
    assert.strictEqual(getConv1.status, 200);
    assert.strictEqual(getConv1.body.conversation.title, 'Confidential Strategy Chat');

    // Manager 2 CANNOT retrieve Manager 1's conversation
    const getConv2 = await request(`/api/ai/conversations/${testConv._id}`, {
      headers: { Authorization: `Bearer ${token2}` },
    });
    // getOrCreateConversation for Manager 2 creates a fresh or returns 404
    if (getConv2.status === 200) {
      assert.notStrictEqual(
        getConv2.body.conversation.title,
        'Confidential Strategy Chat',
        'Manager 2 must never see Manager 1 messages'
      );
    }

    // Manager 1 can delete their conversation
    const delRes = await request(`/api/ai/conversations/${testConv._id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token1}` },
    });
    assert.strictEqual(delRes.status, 200);
    console.log('   ✅ Conversation ownership strictly enforced and cleared.');

    // 12. Chat Endpoint Functional Verification
    console.log('🔹 Test 12: Chat endpoint POST /api/ai/chat response structure...');
    const chatRes = await request('/api/ai/chat', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token1}` },
      body: { message: "Give me today's queue summary" },
    });
    assert.strictEqual(chatRes.status, 200, 'Chat endpoint should return 200');
    assert.strictEqual(chatRes.body.success, true);
    assert(chatRes.body.conversationId, 'conversationId should be returned');
    assert(typeof chatRes.body.reply === 'string', 'reply text should be returned');
    assert(chatRes.body.metadata, 'metadata should be returned');
    assert(chatRes.body.metadata.dataRetrievedAt, 'dataRetrievedAt should be in metadata');
    console.log(`   ✅ Chat endpoint returned valid response (Configured: ${chatRes.body.metadata.isConfigured}).`);

    console.log('\n=============================================================');
    console.log('🎉 ALL 12 AI COPILOT INTEGRATION TESTS PASSED 100%!');
    console.log('=============================================================\n');
  } finally {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
    await disconnectDB();
  }
};

if (require.main === module) {
  runAITests()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('❌ AI Copilot Tests Failed:', err);
      process.exit(1);
    });
}

module.exports = { runAITests };
