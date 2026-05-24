import contributionService from '../services/contribution.service.js';

export const contributionController = {
  async submitProgressLog(req, res, next) {
    try {
      const projectId = parseInt(req.params.id || req.params.projectId, 10);
      const { logText, weekNumber } = req.body;
      if (!logText) {
        return res.status(400).json({ error: 'logText is required.' });
      }

      const log = await contributionService.submitProgressLog(projectId, req.user.id, {
        logText,
        weekNumber,
      });

      res.status(201).json(log);
    } catch (error) {
      next(error);
    }
  },

  async getProgressLogs(req, res, next) {
    try {
      const projectId = parseInt(req.params.id || req.params.projectId, 10);
      const logs = await contributionService.getProgressLogs(projectId);
      res.json(logs);
    } catch (error) {
      next(error);
    }
  },

  async submitPeerReview(req, res, next) {
    try {
      const projectId = parseInt(req.params.id || req.params.projectId, 10);
      const { reviewedUserId, reliability, technicalContribution, communication, meetingAttendance, documentationContribution, comment } = req.body;

      if (!reviewedUserId) {
        return res.status(400).json({ error: 'reviewedUserId is required.' });
      }

      const review = await contributionService.submitPeerReview(projectId, req.user.id, {
        reviewedUserId,
        reliability: parseInt(reliability, 10) || 3,
        technicalContribution: parseInt(technicalContribution, 10) || 3,
        communication: parseInt(communication, 10) || 3,
        meetingAttendance: parseInt(meetingAttendance, 10) || 3,
        documentationContribution: parseInt(documentationContribution, 10) || 3,
        comment,
      });

      res.status(201).json(review);
    } catch (error) {
      next(error);
    }
  },

  async getContributionReport(req, res, next) {
    try {
      const projectId = parseInt(req.params.id || req.params.projectId, 10);
      const report = await contributionService.calculateContributionScores(projectId);
      res.json(report);
    } catch (error) {
      next(error);
    }
  },
};

export default contributionController;
