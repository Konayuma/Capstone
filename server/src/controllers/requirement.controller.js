import { z } from 'zod';
import requirementService from '../services/requirement.service.js';
import prisma from '../config/db.js';

const requirementSchema = z.object({
  type: z.enum(['functional', 'non_functional']),
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().min(5, 'Description must be at least 5 characters'),
  priority: z.enum(['low', 'medium', 'high']).optional(),
  status: z.enum(['draft', 'approved', 'rejected']).optional(),
});

const canAccessProject = (req, project) => {
  if (req.user.role === 'admin') return true;
  if (project.supervisorId === req.user.id) return true;
  return project.members.some((member) => member.userId === req.user.id);
};

const assertRequirementAccess = async (req, requirementId) => {
  const requirement = await prisma.requirement.findUnique({
    where: { id: requirementId },
    include: {
      project: {
        include: { members: true },
      },
    },
  });

  if (!requirement) {
    throw Object.assign(new Error('Requirement not found.'), { status: 404 });
  }
  if (!canAccessProject(req, requirement.project)) {
    throw Object.assign(new Error('You do not have access to this requirement.'), { status: 403 });
  }

  return requirement;
};

const canReviewRequirement = (req, requirement) => (
  req.user.role === 'admin'
  || requirement.project.supervisorId === req.user.id
  || requirement.project.createdBy === req.user.id
  || requirement.project.members.some((member) => (
    member.userId === req.user.id
    && (member.isLeader || member.projectRole === 'project_manager')
  ))
);

export const requirementController = {
  async getProjectRequirements(req, res, next) {
    try {
      const projectId = parseInt(req.params.id || req.params.projectId, 10);
      const requirements = await requirementService.getByProjectId(projectId);
      res.json(requirements);
    } catch (error) {
      next(error);
    }
  },

  async createRequirement(req, res, next) {
    try {
      const projectId = parseInt(req.params.id || req.params.projectId, 10);
      const data = requirementSchema.parse(req.body);
      const requirement = await requirementService.create(projectId, data);
      res.status(201).json(requirement);
    } catch (error) {
      next(error);
    }
  },

  async getRequirementDetails(req, res, next) {
    try {
      const reqId = parseInt(req.params.requirementId, 10);
      await assertRequirementAccess(req, reqId);
      const requirement = await requirementService.getById(reqId);
      if (!requirement) {
        return res.status(404).json({ error: 'Requirement not found.' });
      }
      res.json(requirement);
    } catch (error) {
      next(error);
    }
  },

  async updateRequirement(req, res, next) {
    try {
      const reqId = parseInt(req.params.requirementId, 10);
      await assertRequirementAccess(req, reqId);
      const data = req.body;
      const requirement = await requirementService.update(reqId, data);
      res.json(requirement);
    } catch (error) {
      next(error);
    }
  },

  async deleteRequirement(req, res, next) {
    try {
      const reqId = parseInt(req.params.requirementId, 10);
      await assertRequirementAccess(req, reqId);
      await requirementService.delete(reqId);
      res.json({ message: 'Requirement deleted successfully.' });
    } catch (error) {
      next(error);
    }
  },

  async generateAIRequirements(req, res, next) {
    try {
      const projectId = parseInt(req.params.id || req.params.projectId, 10);
      const { rawDescription } = req.body;
      if (!rawDescription) {
        return res.status(400).json({ error: 'rawDescription is required' });
      }

      const result = await requirementService.generateAIRequirements(projectId, rawDescription);
      res.json(result);
    } catch (error) {
      next(error);
    }
  },

  async generateAcceptanceCriteria(req, res, next) {
    try {
      const reqId = parseInt(req.params.requirementId, 10);
      await assertRequirementAccess(req, reqId);
      const criteria = await requirementService.generateAcceptanceCriteria(reqId);
      res.json({ criteria });
    } catch (error) {
      next(error);
    }
  },

  async generateTestCases(req, res, next) {
    try {
      const reqId = parseInt(req.params.requirementId, 10);
      await assertRequirementAccess(req, reqId);
      const testCases = await requirementService.generateTestCases(reqId);
      res.json({ testCases });
    } catch (error) {
      next(error);
    }
  },

  async getTraceabilityMatrix(req, res, next) {
    try {
      const projectId = parseInt(req.params.id || req.params.projectId, 10);
      const matrix = await requirementService.getTraceabilityMatrix(projectId);
      res.json(matrix);
    } catch (error) {
      next(error);
    }
  },

  async reviewRequirement(req, res, next) {
    try {
      const reqId = parseInt(req.params.requirementId, 10);
      const { status } = z.object({
        status: z.enum(['approved', 'rejected', 'draft']),
      }).parse(req.body);
      const requirement = await assertRequirementAccess(req, reqId);

      if (!canReviewRequirement(req, requirement)) {
        return res.status(403).json({ error: 'Only a supervisor, project manager, or administrator can review requirements.' });
      }

      const updated = await requirementService.update(reqId, { status });
      res.json(updated);
    } catch (error) {
      next(error);
    }
  },
};

export default requirementController;
