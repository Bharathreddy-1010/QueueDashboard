const express = require('express');
const router = express.Router();
const queueController = require('../controllers/queueController');
const tokenController = require('../controllers/tokenController');
const analyticsController = require('../controllers/analyticsController');
const { auth } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { createQueueSchema, updateQueueSchema } = require('../validators/queueValidator');
const { addTokenSchema } = require('../validators/tokenValidator');

// All queue routes are protected
router.use(auth);

// Queues CRUD
router.get('/', queueController.getQueues);
router.post('/', validate(createQueueSchema), queueController.createQueue);
router.get('/:id', queueController.getQueueById);
router.patch('/:id', validate(updateQueueSchema), queueController.updateQueue);
router.delete('/:id', queueController.deleteQueue);

// Nested Token operations under queue
router.get('/:id/tokens', tokenController.getQueueTokens);
router.post('/:id/tokens', validate(addTokenSchema), tokenController.addToken);
router.post('/:id/serve-next', tokenController.serveNext);

// Nested Queue Analytics
router.get('/:id/analytics', analyticsController.getQueueAnalytics);

module.exports = router;
