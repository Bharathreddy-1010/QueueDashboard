const http = require('http');
const assert = require('assert');
const { io: ioClient } = require('socket.io-client');
const app = require('../app');
const { connectDB, disconnectDB } = require('../config/db');
const { initSocket } = require('../sockets/socketManager');
const { runSeed } = require('../scripts/seed');
const queueService = require('../services/queueService');
const Queue = require('../models/Queue');
const User = require('../models/User');

const runSocketTests = async () => {
  console.log('\n=============================================================');
  console.log('📡 RUNNING QUEUEPRO REAL-TIME SOCKET.IO MULTI-CLIENT TESTS');
  console.log('=============================================================\n');

  let server;
  let client1;
  let client2;

  try {
    await connectDB();
    await runSeed();

    server = http.createServer(app);
    initSocket(server);

    await new Promise((resolve) => server.listen(5098, resolve));
    console.log('[Socket Test] Test server listening on http://localhost:5098');

    // Get demo manager token
    const manager = await User.findOne({ email: 'manager@queuepro.com' });
    const jwt = require('jsonwebtoken');
    const config = require('../config/env');
    const token = jwt.sign({ id: manager._id }, config.JWT_SECRET, { expiresIn: '1h' });

    const queue = await Queue.findOne({ managerId: manager._id, status: 'ACTIVE' });
    const queueId = queue._id.toString();

    // Client 1 connects
    client1 = ioClient('http://localhost:5098', {
      auth: { token },
      transports: ['websocket'],
    });

    // Client 2 connects
    client2 = ioClient('http://localhost:5098', {
      auth: { token },
      transports: ['websocket'],
    });

    await Promise.all([
      new Promise((resolve) => client1.on('connect', resolve)),
      new Promise((resolve) => client2.on('connect', resolve)),
    ]);

    console.log('  ✔ Client 1 and Client 2 connected successfully over WebSockets.');

    // Both clients join queue room
    client1.emit('queue:join', queueId);
    client2.emit('queue:join', queueId);
    await new Promise((r) => setTimeout(r, 200));
    console.log(`  ✔ Both clients joined queue room: queue:${queueId}`);

    // Test real-time broadcast: Add Token
    console.log('▶ Test: Real-time broadcast on token added');
    const client2ReceivedAdd = new Promise((resolve) => {
      client2.on('queue:token_added', (payload) => {
        assert.strictEqual(payload.queueId.toString(), queueId);
        assert.strictEqual(payload.token.customerName, 'Socket Realtime Customer');
        resolve();
      });
    });

    await queueService.addTokenToQueue({
      queueId,
      customerName: 'Socket Realtime Customer',
      phoneNumber: '+1 555-8888',
      managerId: manager._id,
    });

    await client2ReceivedAdd;
    console.log('  ✔ Client 2 received queue:token_added in real-time!\n');

    // Test real-time broadcast: Serve Next
    console.log('▶ Test: Real-time broadcast on Serve Next');
    const client2ReceivedServe = new Promise((resolve) => {
      client2.on('queue:token_served', (payload) => {
        assert.strictEqual(payload.queueId.toString(), queueId);
        assert.ok(payload.token);
        assert.strictEqual(payload.token.status, 'IN_SERVICE');
        resolve();
      });
    });

    const served = await queueService.serveNextToken({
      queueId,
      managerId: manager._id,
    });

    await client2ReceivedServe;
    console.log(`  ✔ Client 2 received queue:token_served for ${served.tokenNumber} in real-time!\n`);

    // Test real-time broadcast: Complete Service
    console.log('▶ Test: Real-time broadcast on Complete Service');
    const client1ReceivedComplete = new Promise((resolve) => {
      client1.on('queue:token_completed', (payload) => {
        assert.strictEqual(payload.token.status, 'COMPLETED');
        resolve();
      });
    });

    await queueService.completeService({
      tokenId: served._id,
      managerId: manager._id,
    });

    await client1ReceivedComplete;
    console.log('  ✔ Client 1 received queue:token_completed in real-time!\n');

    console.log('=============================================================');
    console.log('🎉 ALL SOCKET.IO REAL-TIME SYNCHRONIZATION TESTS PASSED!');
    console.log('=============================================================\n');

    client1.disconnect();
    client2.disconnect();
    server.close();
    await disconnectDB();
    process.exit(0);
  } catch (err) {
    console.error('❌ Socket Test Failed:', err);
    if (client1) client1.disconnect();
    if (client2) client2.disconnect();
    if (server) server.close();
    await disconnectDB();
    process.exit(1);
  }
};

runSocketTests();
