const { z } = require('zod');

const createQueueSchema = z.object({
  name: z.string().trim().min(2, 'Queue name must be at least 2 characters').max(120),
  description: z.string().trim().max(500).optional().default(''),
  prefix: z.string().trim().max(5).optional().default('T'),
});

const updateQueueSchema = z.object({
  name: z.string().trim().min(2, 'Queue name must be at least 2 characters').max(120).optional(),
  description: z.string().trim().max(500).optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
  prefix: z.string().trim().max(5).optional(),
});

module.exports = {
  createQueueSchema,
  updateQueueSchema,
};
