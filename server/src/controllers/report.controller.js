import prisma from '../config/db.js';
import { pdfGenerator } from '../utils/pdfGenerator.js';
import contributionService from '../services/contribution.service.js';
import vivaService from '../services/viva.service.js';
import requirementService from '../services/requirement.service.js';

export const reportController = {
  // 1. Export Requirements Report PDF
  async exportRequirementsReport(req, res, next) {
    try {
      const projectId = parseInt(req.params.id || req.params.projectId, 10);
      
      const project = await prisma.project.findUnique({ where: { id: projectId } });
      if (!project) return res.status(404).json({ error: 'Project not found.' });

      const requirements = await requirementService.getByProjectId(projectId);

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=requirements-report-${projectId}.pdf`);

      pdfGenerator.buildRequirementsReport(res, project, requirements);
    } catch (error) {
      next(error);
    }
  },

  // 2. Export Contribution Report PDF
  async exportContributionReport(req, res, next) {
    try {
      const projectId = parseInt(req.params.id || req.params.projectId, 10);

      const project = await prisma.project.findUnique({ where: { id: projectId } });
      if (!project) return res.status(404).json({ error: 'Project not found.' });

      const contributionData = await contributionService.calculateContributionScores(projectId);

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=contribution-report-${projectId}.pdf`);

      pdfGenerator.buildContributionReport(res, project, contributionData);
    } catch (error) {
      next(error);
    }
  },

  // 3. Export Viva Preparation Report PDF
  async exportVivaReport(req, res, next) {
    try {
      const projectId = parseInt(req.params.id || req.params.projectId, 10);

      const project = await prisma.project.findUnique({ where: { id: projectId } });
      if (!project) return res.status(404).json({ error: 'Project not found.' });

      const questions = await vivaService.getVivaQuestions(projectId);
      const score = await vivaService.getLatestReadinessScore(projectId);

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=viva-preparation-report-${projectId}.pdf`);

      pdfGenerator.buildVivaReport(res, project, questions, score);
    } catch (error) {
      next(error);
    }
  },

  // 4. Export Full Audit Report PDF
  async exportFullReport(req, res, next) {
    try {
      const projectId = parseInt(req.params.id || req.params.projectId, 10);

      const project = await prisma.project.findUnique({ where: { id: projectId } });
      if (!project) return res.status(404).json({ error: 'Project not found.' });

      const requirements = await requirementService.getByProjectId(projectId);
      const contributionData = await contributionService.calculateContributionScores(projectId);
      const questions = await vivaService.getVivaQuestions(projectId);
      const score = await vivaService.getLatestReadinessScore(projectId);

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=full-project-audit-${projectId}.pdf`);

      pdfGenerator.buildFullProjectReport(res, project, requirements, contributionData, questions, score);
    } catch (error) {
      next(error);
    }
  },
};

export default reportController;
