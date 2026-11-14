const Queue = require('../models/Queue');
const Token = require('../models/Token');
const QueueEvent = require('../models/QueueEvent');
const { emitToManager, emitToQueue } = require('../sockets/socketManager');

const getQueues = async (req, res, next) => {
  try {
    const managerId = req.user._id;
    const queues = await Queue.find({ managerId }).sort({ createdAt: -1 });

    // Aggregate counts for each queue
    const queueData = await Promise.all(
      queues.map(async (q) => {
        const [waitingCount, inServiceCount, completedCount, currentlyServing] = await Promise.all([
          Token.countDocuments({ queueId: q._id, status: 'WAITING' }),
          Token.countDocuments({ queueId: q._id, status: 'IN_SERVICE' }),
          Token.countDocuments({ queueId: q._id, status: 'COMPLETED' }),
          Token.findOne({ queueId: q._id, status: 'IN_SERVICE' }).sort({ calledAt: -1 }),
        ]);

        return {
          ...q.toObject(),
          waitingCount,
          inServiceCount,
          completedCount,
          currentlyServing,
        };
      })
    );

    res.status(200).json({
      success: true,
      data: queueData,
    });
  } catch (error) {
    next(error);
  }
};

const createQueue = async (req, res, next) => {
  try {
    const { name, description, prefix = 'T' } = req.body;
    const managerId = req.user._id;

    const queue = await Queue.create({
      name,
      description: description || '',
      prefix: prefix.toUpperCase(),
      managerId,
      status: 'ACTIVE',
      nextTokenNumber: 1,
    });

    emitToManager(managerId.toString(), 'queue:created', queue);

    res.status(201).json({
      success: true,
      message: 'Queue created successfully',
      data: queue,
    });
  } catch (error) {
    next(error);
  }
};

const getQueueById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const managerId = req.user._id;

    const queue = await Queue.findOne({ _id: id, managerId });
    if (!queue) {
      return res.status(404).json({
        success: false,
        message: 'Queue not found or unauthorized',
      });
    }

    const [waitingCount, inServiceCount, completedCount, cancelledCount, currentlyServing] = await Promise.all([
      Token.countDocuments({ queueId: queue._id, status: 'WAITING' }),
      Token.countDocuments({ queueId: queue._id, status: 'IN_SERVICE' }),
      Token.countDocuments({ queueId: queue._id, status: 'COMPLETED' }),
      Token.countDocuments({ queueId: queue._id, status: 'CANCELLED' }),
      Token.findOne({ queueId: queue._id, status: 'IN_SERVICE' }).sort({ calledAt: -1 }),
    ]);

    res.status(200).json({
      success: true,
      data: {
        ...queue.toObject(),
        waitingCount,
        inServiceCount,
        completedCount,
        cancelledCount,
        currentlyServing,
      },
    });
  } catch (error) {
    next(error);
  }
};

const updateQueue = async (req, res, next) => {
  try {
    const { id } = req.params;
    const managerId = req.user._id;
    const { name, description, status, prefix } = req.body;

    const queue = await Queue.findOne({ _id: id, managerId });
    if (!queue) {
      return res.status(404).json({
        success: false,
        message: 'Queue not found or unauthorized',
      });
    }

    if (name !== undefined) queue.name = name;
    if (description !== undefined) queue.description = description;
    if (status !== undefined) queue.status = status;
    if (prefix !== undefined) queue.prefix = prefix.toUpperCase();

    await queue.save();

    emitToQueue(id, managerId.toString(), 'queue:updated', queue);
    emitToManager(managerId.toString(), 'queue:updated', queue);

    res.status(200).json({
      success: true,
      message: 'Queue updated successfully',
      data: queue,
    });
  } catch (error) {
    next(error);
  }
};

const deleteQueue = async (req, res, next) => {
  try {
    const { id } = req.params;
    const managerId = req.user._id;

    const queue = await Queue.findOne({ _id: id, managerId });
    if (!queue) {
      return res.status(404).json({
        success: false,
        message: 'Queue not found or unauthorized',
      });
    }

    // Cascade delete tokens & events
    await Promise.all([
      Queue.deleteOne({ _id: id }),
      Token.deleteMany({ queueId: id }),
      QueueEvent.deleteMany({ queueId: id }),
    ]);

    emitToQueue(id, managerId.toString(), 'queue:deleted', { queueId: id });
    emitToManager(managerId.toString(), 'queue:deleted', { queueId: id });

    res.status(200).json({
      success: true,
      message: 'Queue and associated tokens deleted successfully',
      data: { id },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getQueues,
  createQueue,
  getQueueById,
  updateQueue,
  deleteQueue,
};
