import vivaService from '../services/viva.service.js';

export const vivaController = {
  async generateVivaQuestions(req, res, next) {
    try {
      const projectId = parseInt(req.params.id || req.params.projectId, 10);
      const questions = await vivaService.generateVivaQuestions(projectId);
      res.json(questions);
    } catch (error) {
      next(error);
    }
  },

  async getVivaQuestions(req, res, next) {
    try {
      const projectId = parseInt(req.params.id || req.params.projectId, 10);
      const questions = await vivaService.getVivaQuestions(projectId);
      res.json(questions);
    } catch (error) {
      next(error);
    }
  },

  async answerVivaQuestion(req, res, next) {
    try {
      const projectId = req.params.id ? parseInt(req.params.id, 10) : null;
      const questionId = parseInt(req.params.questionId, 10);
      const { answerText } = req.body;
      if (!answerText) {
        return res.status(400).json({ error: 'answerText is required.' });
      }

      if (projectId && req.project?.id !== projectId) {
        return res.status(403).json({ error: 'You do not have access to this project.' });
      }

      const evaluation = await vivaService.evaluateVivaAnswer(req.user.id, questionId, answerText, projectId);
      res.status(201).json(evaluation);
    } catch (error) {
      next(error);
    }
  },

  async generateReadinessScore(req, res, next) {
    try {
      const projectId = parseInt(req.params.id || req.params.projectId, 10);
      const score = await vivaService.calculateReadinessScore(projectId);
      res.json(score);
    } catch (error) {
      next(error);
    }
  },

  async getReadinessScore(req, res, next) {
    try {
      const projectId = parseInt(req.params.id || req.params.projectId, 10);
      let score = await vivaService.getLatestReadinessScore(projectId);
      if (!score) {
        // Fallback: generate it on the fly if none exists yet
        score = await vivaService.calculateReadinessScore(projectId);
      }
      res.json(score);
    } catch (error) {
      next(error);
    }
  },
};

export default vivaController;
