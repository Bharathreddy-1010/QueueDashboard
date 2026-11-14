const { z } = require('zod');

const addTokenSchema = z.object({
  customerName: z.string().trim().min(1, 'Customer name is required').max(100),
  phoneNumber: z.string().trim().max(30).optional().default(''),
});

const moveTokenSchema = z.object({
  direction: z.enum(['up', 'down', 'top', 'bottom']),
  targetPosition: z.number().int().min(1).optional(),
});

const cancelTokenSchema = z.object({
  reason: z.string().trim().max(200).optional().default('Cancelled by manager'),
});

module.exports = {
  addTokenSchema,
  moveTokenSchema,
  cancelTokenSchema,
};
