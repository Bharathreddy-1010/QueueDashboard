const { z } = require('zod');

const chatRequestSchema = z.object({
  message: z
    .string({ required_error: 'Message is required' })
    .trim()
    .min(1, 'Message cannot be empty')
    .max(2000, 'Message cannot exceed 2000 characters'),
  conversationId: z
    .string()
    .trim()
    .regex(/^[0-9a-fA-F]{24}$/, 'Invalid conversation ID format')
    .nullable()
    .optional(),
  queueId: z
    .string()
    .trim()
    .regex(/^[0-9a-fA-F]{24}$/, 'Invalid queue ID format')
    .nullable()
    .optional(),
});

const conversationIdParamSchema = z.object({
  id: z
    .string({ required_error: 'Conversation ID parameter is required' })
    .trim()
    .regex(/^[0-9a-fA-F]{24}$/, 'Invalid conversation ID format'),
});

module.exports = {
  chatRequestSchema,
  conversationIdParamSchema,
};
