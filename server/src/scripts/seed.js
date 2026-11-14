const mongoose = require('mongoose');
const User = require('../models/User');
const Queue = require('../models/Queue');
const Token = require('../models/Token');
const QueueEvent = require('../models/QueueEvent');

const runSeed = async () => {
  console.log('[Seed] Clearing existing collections...');
  await Promise.all([
    User.deleteMany({}),
    Queue.deleteMany({}),
    Token.deleteMany({}),
    QueueEvent.deleteMany({}),
  ]);

  console.log('[Seed] Creating demo users...');
  const passwordHash = await User.hashPassword('Password123!');

  const demoManager = await User.create({
    name: 'Alex Morgan',
    email: 'manager@queuepro.com',
    passwordHash,
    role: 'manager',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
  });

  const otherManager = await User.create({
    name: 'Sarah Jenkins',
    email: 'sarah@queuepro.com',
    passwordHash,
    role: 'manager',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150',
  });

  console.log('[Seed] Creating queues for demo manager...');
  const queueGeneral = await Queue.create({
    name: 'General Customer Service',
    description: 'Main service counter for standard account assistance, inquiries, and cashiering.',
    prefix: 'T',
    managerId: demoManager._id,
    status: 'ACTIVE',
    nextTokenNumber: 25,
  });

  const queueVIP = await Queue.create({
    name: 'Priority & VIP Desk',
    description: 'Dedicated high-touch counter for corporate clients and premium members.',
    prefix: 'VIP',
    managerId: demoManager._id,
    status: 'ACTIVE',
    nextTokenNumber: 8,
  });

  const queueTech = await Queue.create({
    name: 'Technical Support & Returns',
    description: 'Hardware diagnostics, equipment swaps, and technical troubleshooting.',
    prefix: 'TECH',
    managerId: demoManager._id,
    status: 'ACTIVE',
    nextTokenNumber: 12,
  });

  const queueExpress = await Queue.create({
    name: 'Express Document Verification',
    description: 'Fast-track station for instant stamp, notarization, and badge pick-ups.',
    prefix: 'EXP',
    managerId: demoManager._id,
    status: 'INACTIVE',
    nextTokenNumber: 5,
  });

  // Queue for Sarah (manager isolation test)
  await Queue.create({
    name: 'Corporate Advisory Queue',
    description: "Sarah's private consulting counter.",
    prefix: 'ADV',
    managerId: otherManager._id,
    status: 'ACTIVE',
    nextTokenNumber: 4,
  });

  console.log('[Seed] Creating realistic tokens & history for General Customer Service...');
  const now = new Date();

  // 1. IN_SERVICE Token
  const inServiceCalledAt = new Date(now.getTime() - 8 * 60 * 1000);
  await Token.create({
    queueId: queueGeneral._id,
    tokenNumber: 'T008',
    customerName: 'Marcus Vance',
    phoneNumber: '+1 (555) 234-5678',
    status: 'IN_SERVICE',
    position: null,
    createdAt: new Date(now.getTime() - 25 * 60 * 1000),
    calledAt: inServiceCalledAt,
  });

  // 2. WAITING Tokens
  const waitingCustomers = [
    { name: 'Rahul Sharma', phone: '+1 (555) 345-6789', waitMins: 18 },
    { name: 'Priya Patel', phone: '+1 (555) 456-7890', waitMins: 14 },
    { name: 'Arjun Mehta', phone: '+1 (555) 567-8901', waitMins: 11 },
    { name: 'Sofia Rodriguez', phone: '+1 (555) 678-9012', waitMins: 8 },
    { name: 'Liam Chen', phone: '+1 (555) 789-0123', waitMins: 5 },
    { name: 'Zoe Washington', phone: '+1 (555) 890-1234', waitMins: 2 },
  ];

  for (let i = 0; i < waitingCustomers.length; i++) {
    const c = waitingCustomers[i];
    const tokenNum = `T${String(9 + i).padStart(3, '0')}`;
    const token = await Token.create({
      queueId: queueGeneral._id,
      tokenNumber: tokenNum,
      customerName: c.name,
      phoneNumber: c.phone,
      status: 'WAITING',
      position: i + 1,
      createdAt: new Date(now.getTime() - c.waitMins * 60 * 1000),
    });

    await QueueEvent.create({
      queueId: queueGeneral._id,
      tokenId: token._id,
      eventType: 'TOKEN_ADDED',
      previousPosition: null,
      newPosition: i + 1,
      waitingCount: i + 1,
      timestamp: token.createdAt,
      metadata: { tokenNumber: token.tokenNumber, customerName: token.customerName },
    });
  }

  // 3. COMPLETED Tokens
  const completedCustomers = [
    { name: 'Daniel Craig', tokenNum: 'T001', waitMins: 7, serviceMins: 9, hoursAgo: 5 },
    { name: 'Emma Watson', tokenNum: 'T002', waitMins: 12, serviceMins: 8, hoursAgo: 4.5 },
    { name: 'James Wilson', tokenNum: 'T003', waitMins: 9, serviceMins: 14, hoursAgo: 4 },
    { name: 'Aisha Al-Mansoor', tokenNum: 'T004', waitMins: 6, serviceMins: 11, hoursAgo: 3.2 },
    { name: 'Lucas Scott', tokenNum: 'T005', waitMins: 14, serviceMins: 7, hoursAgo: 2.5 },
    { name: 'Clara Oswald', tokenNum: 'T006', waitMins: 8, serviceMins: 10, hoursAgo: 1.8 },
    { name: 'Benjamin Sisko', tokenNum: 'T007', waitMins: 10, serviceMins: 12, hoursAgo: 1.1 },
  ];

  for (const c of completedCustomers) {
    const created = new Date(now.getTime() - c.hoursAgo * 60 * 60 * 1000);
    const called = new Date(created.getTime() + c.waitMins * 60 * 1000);
    const completed = new Date(called.getTime() + c.serviceMins * 60 * 1000);

    const token = await Token.create({
      queueId: queueGeneral._id,
      tokenNumber: c.tokenNum,
      customerName: c.name,
      phoneNumber: '+1 (555) 999-0000',
      status: 'COMPLETED',
      position: null,
      createdAt: created,
      calledAt: called,
      completedAt: completed,
    });

    await QueueEvent.create({
      queueId: queueGeneral._id,
      tokenId: token._id,
      eventType: 'TOKEN_CALLED',
      previousPosition: 1,
      newPosition: null,
      waitingCount: 4,
      timestamp: called,
    });

    await QueueEvent.create({
      queueId: queueGeneral._id,
      tokenId: token._id,
      eventType: 'TOKEN_COMPLETED',
      previousPosition: null,
      newPosition: null,
      waitingCount: 4,
      timestamp: completed,
    });
  }

  // 4. CANCELLED Tokens
  const cancelledToken = await Token.create({
    queueId: queueGeneral._id,
    tokenNumber: 'T015',
    customerName: 'Ethan Hunt',
    phoneNumber: '+1 (555) 000-1111',
    status: 'CANCELLED',
    cancellationReason: 'Customer had to leave early for an emergency meeting',
    position: null,
    createdAt: new Date(now.getTime() - 2 * 60 * 60 * 1000),
    cancelledAt: new Date(now.getTime() - 1.5 * 60 * 60 * 1000),
  });

  await QueueEvent.create({
    queueId: queueGeneral._id,
    tokenId: cancelledToken._id,
    eventType: 'TOKEN_CANCELLED',
    previousPosition: 3,
    newPosition: null,
    waitingCount: 5,
    timestamp: cancelledToken.cancelledAt,
  });

  // VIP queue tokens
  await Token.create({
    queueId: queueVIP._id,
    tokenNumber: 'VIP001',
    customerName: 'Lady Catherine',
    phoneNumber: '+1 (555) 777-8888',
    status: 'WAITING',
    position: 1,
    createdAt: new Date(now.getTime() - 9 * 60 * 1000),
  });

  await Token.create({
    queueId: queueVIP._id,
    tokenNumber: 'VIP002',
    customerName: 'Sir Arthur Conan',
    phoneNumber: '+1 (555) 777-9999',
    status: 'WAITING',
    position: 2,
    createdAt: new Date(now.getTime() - 4 * 60 * 1000),
  });

  console.log('✅ Demo seed completed successfully!');
};

// If run directly from CLI
if (require.main === module) {
  const { connectDB, disconnectDB } = require('../config/db');
  (async () => {
    try {
      await connectDB();
      await runSeed();
      await disconnectDB();
      process.exit(0);
    } catch (err) {
      console.error(err);
      process.exit(1);
    }
  })();
}

module.exports = { runSeed };
