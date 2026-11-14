const http = require('http');
const assert = require('assert');
const app = require('../app');
const { connectDB, disconnectDB } = require('../config/db');
const User = require('../models/User');
const Queue = require('../models/Queue');
const Token = require('../models/Token');
const QueueEvent = require('../models/QueueEvent');
const { runSeed } = require('../scripts/seed');

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

const runTests = async () => {
  console.log('\n=============================================================');
  console.log('🧪 RUNNING QUEUEPRO BACKEND INTEGRATION & VERIFICATION TESTS');
  console.log('=============================================================\n');

  try {
    await connectDB();
    await runSeed();

    server = http.createServer(app);
    await new Promise((resolve) => server.listen(5099, resolve));
    baseUrl = 'http://localhost:5099';
    console.log(`[Test Harness] Server running on ${baseUrl}\n`);

    let managerToken = '';
    let sarahToken = '';
    let demoQueueId = '';
    let testTokenId = '';
    let secondTokenId = '';

    // Test 1: Manager Authentication (Valid Login)
    console.log('▶ Test 1: Manager Login with valid credentials');
    const loginRes = await request('/api/auth/login', {
      method: 'POST',
      body: { email: 'manager@queuepro.com', password: 'Password123!' },
    });
    assert.strictEqual(loginRes.status, 200, 'Login should return 200');
    assert.strictEqual(loginRes.body.success, true);
    assert.ok(loginRes.body.data.token, 'Should return JWT token');
    managerToken = loginRes.body.data.token;
    console.log('  ✔ Login successful, JWT token obtained.\n');

    // Test 2: Manager Authentication (Invalid credentials)
    console.log('▶ Test 2: Manager Login with invalid password');
    const badLoginRes = await request('/api/auth/login', {
      method: 'POST',
      body: { email: 'manager@queuepro.com', password: 'WrongPassword' },
    });
    assert.strictEqual(badLoginRes.status, 401, 'Should return 401 for bad password');
    console.log('  ✔ Bad credentials rejected properly with 401.\n');

    // Test 3: Log in as second manager (Sarah) to test multi-tenancy
    console.log('▶ Test 3: Second Manager Login (Sarah)');
    const sarahLogin = await request('/api/auth/login', {
      method: 'POST',
      body: { email: 'sarah@queuepro.com', password: 'Password123!' },
    });
    assert.strictEqual(sarahLogin.status, 200);
    sarahToken = sarahLogin.body.data.token;
    console.log('  ✔ Second manager authenticated.\n');

    // Test 4: Auth /me endpoint
    console.log('▶ Test 4: Verify current user session via /api/auth/me');
    const meRes = await request('/api/auth/me', {
      headers: { Authorization: `Bearer ${managerToken}` },
    });
    assert.strictEqual(meRes.status, 200);
    assert.strictEqual(meRes.body.data.user.email, 'manager@queuepro.com');
    console.log('  ✔ User session verified for manager@queuepro.com.\n');

    // Test 5: Get Queues for Manager
    console.log('▶ Test 5: Fetch Queues for manager');
    const queuesRes = await request('/api/queues', {
      headers: { Authorization: `Bearer ${managerToken}` },
    });
    assert.strictEqual(queuesRes.status, 200);
    assert.ok(Array.isArray(queuesRes.body.data), 'Queues should be an array');
    assert.ok(queuesRes.body.data.length >= 3, 'Should have seeded queues');
    const generalQueue = queuesRes.body.data.find((q) => q.name.includes('General Customer Service'));
    assert.ok(generalQueue, 'General Customer Service queue should exist');
    demoQueueId = generalQueue._id;
    console.log(`  ✔ Found ${queuesRes.body.data.length} queues for manager. Selected Queue: ${demoQueueId}\n`);

    // Test 6: Multi-tenant isolation - Sarah should not access demo manager's queue
    console.log("▶ Test 6: Multi-tenant security check (Sarah accessing Alex's queue)");
    const unauthorizedQueueRes = await request(`/api/queues/${demoQueueId}`, {
      headers: { Authorization: `Bearer ${sarahToken}` },
    });
    assert.strictEqual(unauthorizedQueueRes.status, 404, 'Unauthorized queue access should return 404');
    console.log("  ✔ Unauthorized access correctly blocked (404 Not Found).\n");

    // Test 7: Create a new Queue
    console.log('▶ Test 7: Create a new Queue');
    const newQueueRes = await request('/api/queues', {
      method: 'POST',
      headers: { Authorization: `Bearer ${managerToken}` },
      body: {
        name: 'Rapid Express Desk',
        description: 'Ultra fast 2-minute transactions',
        prefix: 'RAPID',
      },
    });
    assert.strictEqual(newQueueRes.status, 201);
    assert.strictEqual(newQueueRes.body.data.name, 'Rapid Express Desk');
    assert.strictEqual(newQueueRes.body.data.prefix, 'RAPID');
    const createdQueueId = newQueueRes.body.data._id;
    console.log(`  ✔ Queue created successfully with ID: ${createdQueueId}\n`);

    // Test 8: Add person to queue (Token generation & unique numbering)
    console.log('▶ Test 8: Add Person to Rapid Queue (Token generation & positioning)');
    const addToken1 = await request(`/api/queues/${createdQueueId}/tokens`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${managerToken}` },
      body: { customerName: 'Alice Baker', phoneNumber: '+1 555-0100' },
    });
    assert.strictEqual(addToken1.status, 201);
    assert.strictEqual(addToken1.body.data.tokenNumber, 'RAPID001');
    assert.strictEqual(addToken1.body.data.position, 1);
    testTokenId = addToken1.body.data._id;
    console.log(`  ✔ First token generated: ${addToken1.body.data.tokenNumber} at position 1`);

    const addToken2 = await request(`/api/queues/${createdQueueId}/tokens`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${managerToken}` },
      body: { customerName: 'Bob Vance', phoneNumber: '+1 555-0101' },
    });
    assert.strictEqual(addToken2.status, 201);
    assert.strictEqual(addToken2.body.data.tokenNumber, 'RAPID002');
    assert.strictEqual(addToken2.body.data.position, 2);
    secondTokenId = addToken2.body.data._id;
    console.log(`  ✔ Second token generated: ${addToken2.body.data.tokenNumber} at position 2\n`);

    const addToken3 = await request(`/api/queues/${createdQueueId}/tokens`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${managerToken}` },
      body: { customerName: 'Charlie Green', phoneNumber: '+1 555-0102' },
    });
    assert.strictEqual(addToken3.status, 201);
    assert.strictEqual(addToken3.body.data.tokenNumber, 'RAPID003');
    assert.strictEqual(addToken3.body.data.position, 3);
    const thirdTokenId = addToken3.body.data._id;
    console.log(`  ✔ Third token generated: ${addToken3.body.data.tokenNumber} at position 3\n`);

    // Test 9: Move token up / down and boundaries check
    console.log('▶ Test 9: Move Token Up/Down and Boundary Enforcement');
    // Try moving token 1 UP (should fail boundary check)
    const badMoveUp = await request(`/api/tokens/${testTokenId}/move`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${managerToken}` },
      body: { direction: 'up' },
    });
    assert.strictEqual(badMoveUp.status, 400, 'Moving position 1 UP should return 400');
    console.log('  ✔ Boundary check passed: cannot move position 1 above first position.');

    // Move token 2 UP (should swap with token 1)
    const moveUpRes = await request(`/api/tokens/${secondTokenId}/move`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${managerToken}` },
      body: { direction: 'up' },
    });
    assert.strictEqual(moveUpRes.status, 200);
    assert.strictEqual(moveUpRes.body.data.position, 1, 'Token 2 should now be at position 1');

    const token1AfterMove = await Token.findById(testTokenId);
    assert.strictEqual(token1AfterMove.position, 2, 'Token 1 should now be at position 2');
    console.log('  ✔ Swapped positions successfully: RAPID002 is now #1, RAPID001 is now #2.\n');

    // Move position 3 DOWN (should fail boundary check)
    const badMoveDown = await request(`/api/tokens/${thirdTokenId}/move`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${managerToken}` },
      body: { direction: 'down' },
    });
    assert.strictEqual(badMoveDown.status, 400, 'Moving bottom position DOWN should return 400');
    console.log('  ✔ Boundary check passed: cannot move bottom token below last position.\n');

    // Test 10: Serve Next Token
    console.log('▶ Test 10: Serve Next Token (Atomic)');
    const serveRes = await request(`/api/queues/${createdQueueId}/serve-next`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${managerToken}` },
    });
    assert.strictEqual(serveRes.status, 200);
    assert.strictEqual(serveRes.body.data.status, 'IN_SERVICE');
    assert.strictEqual(serveRes.body.data.tokenNumber, 'RAPID002');
    assert.ok(serveRes.body.data.calledAt, 'calledAt timestamp must be recorded');
    console.log(`  ✔ Successfully served next token: ${serveRes.body.data.tokenNumber} (calledAt recorded).\n`);

    // Verify remaining waiting positions compacted
    const remainingWaiting = await Token.find({ queueId: createdQueueId, status: 'WAITING' }).sort({ position: 1 });
    assert.strictEqual(remainingWaiting.length, 2);
    assert.strictEqual(remainingWaiting[0].position, 1, 'RAPID001 should now be position 1');
    assert.strictEqual(remainingWaiting[1].position, 2, 'RAPID003 should now be position 2');
    console.log('  ✔ Remaining waiting queue positions recompacted (positions: 1, 2).\n');

    // Test 11: Complete Service
    console.log('▶ Test 11: Mark Service Completed');
    const completeRes = await request(`/api/tokens/${secondTokenId}/complete`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${managerToken}` },
    });
    assert.strictEqual(completeRes.status, 200);
    assert.strictEqual(completeRes.body.data.status, 'COMPLETED');
    assert.ok(completeRes.body.data.completedAt, 'completedAt timestamp must be recorded');
    console.log(`  ✔ Token ${completeRes.body.data.tokenNumber} marked COMPLETED.\n`);

    // Test 12: Cancel Token
    console.log('▶ Test 12: Cancel Token with confirmation & reason');
    const cancelRes = await request(`/api/tokens/${thirdTokenId}/cancel`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${managerToken}` },
      body: { reason: 'Customer requested cancellation' },
    });
    assert.strictEqual(cancelRes.status, 200);
    assert.strictEqual(cancelRes.body.data.status, 'CANCELLED');
    assert.strictEqual(cancelRes.body.data.cancellationReason, 'Customer requested cancellation');
    console.log(`  ✔ Token ${cancelRes.body.data.tokenNumber} cancelled successfully.\n`);

    // Test 13: Clean up created test queue
    console.log('▶ Test 13: Delete Queue and cascade clean up');
    const deleteRes = await request(`/api/queues/${createdQueueId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${managerToken}` },
    });
    assert.strictEqual(deleteRes.status, 200);
    const tokensRemaining = await Token.countDocuments({ queueId: createdQueueId });
    assert.strictEqual(tokensRemaining, 0, 'Associated tokens should be deleted');
    console.log('  ✔ Queue and associated tokens deleted cleanly.\n');

    // Test 14: Analytics Overview Calculation
    console.log('▶ Test 14: Analytics Overview from actual database records');
    const analyticsRes = await request('/api/analytics/overview?range=today', {
      headers: { Authorization: `Bearer ${managerToken}` },
    });
    assert.strictEqual(analyticsRes.status, 200);
    const metrics = analyticsRes.body.data.metrics;
    assert.ok(metrics.totalWaiting >= 0, 'Should have totalWaiting');
    assert.ok(metrics.totalServed >= 0, 'Should have totalServed');
    assert.ok(metrics.avgWaitingTimeFormatted, 'Should format average waiting time');
    assert.ok(metrics.queueEfficiencyPercentage >= 0, 'Should calculate queue efficiency');
    assert.ok(Array.isArray(analyticsRes.body.data.charts.statusDistribution), 'Status distribution chart data');
    assert.ok(Array.isArray(analyticsRes.body.data.charts.hourlyServed), 'Hourly served chart data');
    console.log(`  ✔ Analytics verified: Waiting=${metrics.totalWaiting}, Served=${metrics.totalServed}, AvgWait=${metrics.avgWaitingTimeFormatted}, Efficiency=${metrics.queueEfficiencyPercentage}%\n`);

    console.log('=============================================================');
    console.log('🎉 ALL 14 BACKEND INTEGRATION TESTS PASSED WITH 100% SUCCESS!');
    console.log('=============================================================\n');

    server.close();
    await disconnectDB();
    process.exit(0);
  } catch (err) {
    console.error('\n❌ TEST FAILURE:', err);
    if (server) server.close();
    await disconnectDB();
    process.exit(1);
  }
};

runTests();
