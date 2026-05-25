import prisma from '../config/db.js';

export const supervisorController = {
  async listAssignedProjects(req, res, next) {
    try {
      if (!['supervisor', 'admin'].includes(req.user.role)) {
        return res.status(403).json({ error: 'Supervisor access required.' });
      }

      const where = req.user.role === 'admin' ? {} : { supervisorId: req.user.id };
      const projects = await prisma.project.findMany({
        where,
        include: {
          creator: { select: { id: true, name: true, email: true } },
          members: { include: { user: { select: { id: true, name: true, email: true } } } },
          _count: {
            select: { requirements: true, tasks: true, files: true, vivaQuestions: true, comments: true },
          },
          readinessScores: {
            orderBy: { generatedAt: 'desc' },
            take: 1,
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      res.json(projects);
    } catch (error) {
      next(error);
    }
  },

  async getOverview(req, res, next) {
    try {
      if (!['supervisor', 'admin'].includes(req.user.role)) {
        return res.status(403).json({ error: 'Supervisor access required.' });
      }

      const where = req.user.role === 'admin' ? {} : { supervisorId: req.user.id };
      const [projects, activeProjects, completedProjects] = await Promise.all([
        prisma.project.count({ where }),
        prisma.project.count({ where: { ...where, status: 'active' } }),
        prisma.project.count({ where: { ...where, status: 'completed' } }),
      ]);

      const requirementWhere = req.user.role === 'admin'
        ? {}
        : { project: { supervisorId: req.user.id } };
      const requirementStatus = await prisma.requirement.groupBy({
        by: ['status'],
        where: requirementWhere,
        _count: { id: true },
      });

      res.json({
        projects,
        activeProjects,
        completedProjects,
        requirementStatus,
      });
    } catch (error) {
      next(error);
    }
  },

  // Add a comment to a requirement, task, document, contribution report, or readiness dashboard
  async addComment(req, res, next) {
    try {
      const projectId = parseInt(req.params.id || req.params.projectId, 10);
      const { targetType, targetId, commentText } = req.body;

      if (!targetType || !commentText) {
        return res.status(400).json({ error: 'targetType and commentText are required.' });
      }

      const comment = await prisma.supervisorComment.create({
        data: {
          projectId,
          userId: req.user.id,
          targetType,
          targetId: targetId ? parseInt(targetId, 10) : null,
          commentText,
        },
        include: {
          user: { select: { id: true, name: true, role: true } },
        },
      });

      res.status(201).json(comment);
    } catch (error) {
      next(error);
    }
  },

  // Get all comments for a project
  async getComments(req, res, next) {
    try {
      const projectId = parseInt(req.params.id || req.params.projectId, 10);
      const comments = await prisma.supervisorComment.findMany({
        where: { projectId },
        include: {
          user: { select: { id: true, name: true, role: true } },
        },
        orderBy: { createdAt: 'desc' },
      });
      res.json(comments);
    } catch (error) {
      next(error);
    }
  },

  // Delete a supervisor comment
  async deleteComment(req, res, next) {
    try {
      const commentId = parseInt(req.params.commentId, 10);

      const comment = await prisma.supervisorComment.findUnique({
        where: { id: commentId },
      });

      if (!comment) {
        return res.status(404).json({ error: 'Comment not found.' });
      }

      if (comment.userId !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({ error: 'You do not have permission to delete this comment.' });
      }

      await prisma.supervisorComment.delete({
        where: { id: commentId },
      });

      res.json({ message: 'Comment deleted successfully.' });
    } catch (error) {
      next(error);
    }
  },
};

export default supervisorController;
