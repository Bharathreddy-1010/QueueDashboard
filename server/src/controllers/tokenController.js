const Token = require('../models/Token');
const Queue = require('../models/Queue');
const queueService = require('../services/queueService');

const getQueueTokens = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, search } = req.query;
    const managerId = req.user._id;

    const queue = await Queue.findOne({ _id: id, managerId });
    if (!queue) {
      return res.status(404).json({
        success: false,
        message: 'Queue not found or unauthorized',
      });
    }

    const filter = { queueId: id };

    if (status && status !== 'ALL') {
      filter.status = status;
    }

    if (search) {
      filter.$or = [
        { customerName: { $regex: search, $options: 'i' } },
        { tokenNumber: { $regex: search, $options: 'i' } },
        { phoneNumber: { $regex: search, $options: 'i' } },
      ];
    }

    // Determine sorting
    let sortQuery = { createdAt: -1 };
    if (status === 'WAITING' || !status || status === 'ALL') {
      sortQuery = { position: 1, createdAt: 1 };
    }

    const tokens = await Token.find(filter).sort(sortQuery);

    // Summary counts for filter tabs
    const [waitingCount, inServiceCount, completedCount, cancelledCount] = await Promise.all([
      Token.countDocuments({ queueId: id, status: 'WAITING' }),
      Token.countDocuments({ queueId: id, status: 'IN_SERVICE' }),
      Token.countDocuments({ queueId: id, status: 'COMPLETED' }),
      Token.countDocuments({ queueId: id, status: 'CANCELLED' }),
    ]);

    res.status(200).json({
      success: true,
      data: {
        tokens,
        counts: {
          total: waitingCount + inServiceCount + completedCount + cancelledCount,
          waiting: waitingCount,
          inService: inServiceCount,
          completed: completedCount,
          cancelled: cancelledCount,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

const addToken = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { customerName, phoneNumber } = req.body;
    const managerId = req.user._id;

    const token = await queueService.addTokenToQueue({
      queueId: id,
      customerName,
      phoneNumber,
      managerId,
    });

    res.status(201).json({
      success: true,
      message: `Token ${token.tokenNumber} issued successfully`,
      data: token,
    });
  } catch (error) {
    next(error);
  }
};

const moveToken = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { direction, targetPosition } = req.body;
    const managerId = req.user._id;

    const updatedToken = await queueService.moveToken({
      tokenId: id,
      direction,
      targetPosition,
      managerId,
    });

    res.status(200).json({
      success: true,
      message: `Token ${updatedToken.tokenNumber} moved successfully to position ${updatedToken.position}`,
      data: updatedToken,
    });
  } catch (error) {
    next(error);
  }
};

const serveNext = async (req, res, next) => {
  try {
    const { id } = req.params;
    const managerId = req.user._id;

    const servedToken = await queueService.serveNextToken({
      queueId: id,
      managerId,
    });

    res.status(200).json({
      success: true,
      message: `Serving next: ${servedToken.tokenNumber} (${servedToken.customerName})`,
      data: servedToken,
    });
  } catch (error) {
    next(error);
  }
};

const completeToken = async (req, res, next) => {
  try {
    const { id } = req.params;
    const managerId = req.user._id;

    const token = await queueService.completeService({
      tokenId: id,
      managerId,
    });

    res.status(200).json({
      success: true,
      message: `Token ${token.tokenNumber} service completed`,
      data: token,
    });
  } catch (error) {
    next(error);
  }
};

const cancelToken = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const managerId = req.user._id;

    const token = await queueService.cancelToken({
      tokenId: id,
      reason,
      managerId,
    });

    res.status(200).json({
      success: true,
      message: `Token ${token.tokenNumber} cancelled`,
      data: token,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getQueueTokens,
  addToken,
  moveToken,
  serveNext,
  completeToken,
  cancelToken,
};
