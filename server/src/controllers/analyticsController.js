const analyticsService = require('../services/analyticsService');

const getOverviewAnalytics = async (req, res, next) => {
  try {
    const managerId = req.user._id;
    const { range = 'today', startDate, endDate } = req.query;

    const data = await analyticsService.getAnalytics({
      managerId,
      range,
      customStart: startDate,
      customEnd: endDate,
    });

    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};

const getQueueAnalytics = async (req, res, next) => {
  try {
    const { id } = req.params;
    const managerId = req.user._id;
    const { range = 'today', startDate, endDate } = req.query;

    const data = await analyticsService.getAnalytics({
      managerId,
      queueId: id,
      range,
      customStart: startDate,
      customEnd: endDate,
    });

    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getOverviewAnalytics,
  getQueueAnalytics,
};
