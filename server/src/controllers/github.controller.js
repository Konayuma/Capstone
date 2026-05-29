import { z } from 'zod';
import prisma from '../config/db.js';
import { githubService } from '../services/github.service.js';

const connectionSchema = z.object({
  repositoryUrl: z.string().trim().min(1, 'Repository URL is required.'),
  installationId: z.coerce.number().int().positive().optional(),
  defaultBranch: z.string().trim().optional().default('main'),
  docsPath: z.string().trim().optional().default('docs'),
  requirementsPath: z.string().trim().optional().default('requirements'),
  notesPath: z.string().trim().optional().default('notes'),
});

const projectIdSchema = z.coerce.number().int().positive();

const loadProject = async (projectId) => prisma.project.findUnique({
  where: { id: projectId },
});

const githubController = {
  async getProjectIntegration(req, res, next) {
    try {
      const projectId = projectIdSchema.parse(req.params.id);
      const project = await loadProject(projectId);

      if (!project) {
        return res.status(404).json({ error: 'Project not found.' });
      }

      res.json({
        project,
        connection: githubService.getProjectConnection(project),
      });
    } catch (error) {
      next(error);
    }
  },

  async updateProjectIntegration(req, res, next) {
    try {
      const projectId = projectIdSchema.parse(req.params.id);
      const payload = connectionSchema.parse(req.body);
      const result = await githubService.saveProjectConnection(projectId, payload);

      res.json(result);
    } catch (error) {
      next(error);
    }
  },

  async getAppInstallUrl(req, res, next) {
    try {
      const owner = req.query.owner || undefined;
      res.json({
        installUrl: githubService.getGithubAppInstallUrl(owner),
      });
    } catch (error) {
      next(error);
    }
  },

  async syncProjectRepository(req, res, next) {
    try {
      const projectId = projectIdSchema.parse(req.params.id);
      const project = await loadProject(projectId);

      if (!project) {
        return res.status(404).json({ error: 'Project not found.' });
      }

      const result = await githubService.syncProjectRepository(project, req.user?.id);
      res.json(result);
    } catch (error) {
      next(error);
    }
  },

  async disconnectProjectRepository(req, res, next) {
    try {
      const projectId = projectIdSchema.parse(req.params.id);
      const result = await githubService.disconnectProjectConnection(projectId);
      res.json(result);
    } catch (error) {
      next(error);
    }
  },

  async handleWebhook(req, res, next) {
    try {
      const result = await githubService.handleWebhookRequest(req);
      res.status(result.ignored ? 202 : 200).json(result);
    } catch (error) {
      next(error);
    }
  },
};

export default githubController;
