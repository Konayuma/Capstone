import prisma from '../config/db.js';

export const supervisorController = {
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
