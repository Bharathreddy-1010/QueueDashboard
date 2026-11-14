const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { auth } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { loginSchema, registerSchema, updateProfileSchema } = require('../validators/authValidator');

router.post('/login', validate(loginSchema), authController.login);
router.post('/register', validate(registerSchema), authController.register);
router.post('/logout', auth, authController.logout);
router.get('/me', auth, authController.getMe);
router.patch('/profile', auth, validate(updateProfileSchema), authController.updateProfile);

module.exports = router;
