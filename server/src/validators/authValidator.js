const { z } = require('zod');

const loginSchema = z.object({
  email: z.string().trim().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const registerSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().trim().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const updateProfileSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(100).optional(),
  email: z.string().trim().email('Invalid email address').optional(),
  currentPassword: z.string().min(1, 'Current password is required to make profile updates').optional(),
  newPassword: z.string().min(6, 'New password must be at least 6 characters').optional(),
});

module.exports = {
  loginSchema,
  registerSchema,
  updateProfileSchema,
};
