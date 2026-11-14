const express = require('express');
const { auth } = require('../middleware/auth');
const aiRateLimit = require('../middleware/aiRateLimit');
const aiController = require('../controllers/ai.controller');

const router = express.Router();

// All AI endpoints require manager authentication
router.use(auth);

// Apply rate limiting to all AI endpoints
router.use(aiRateLimit);

// Primary chat query endpoint
router.post('/chat', aiController.chat);

// Conversation management endpoints
router.get('/conversations', aiController.listConversations);
router.get('/conversations/:id', aiController.getConversation);
router.delete('/conversations/:id', aiController.deleteConversation);

module.exports = router;
