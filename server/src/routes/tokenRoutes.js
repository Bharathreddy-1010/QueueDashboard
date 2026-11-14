const express = require('express');
const router = express.Router();
const tokenController = require('../controllers/tokenController');
const { auth } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { moveTokenSchema, cancelTokenSchema } = require('../validators/tokenValidator');

router.use(auth);

router.patch('/:id/move', validate(moveTokenSchema), tokenController.moveToken);
router.post('/:id/complete', tokenController.completeToken);
router.post('/:id/cancel', validate(cancelTokenSchema), tokenController.cancelToken);

module.exports = router;
