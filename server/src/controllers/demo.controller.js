import authService from '../services/auth.service.js';
import prisma from '../config/db.js';

export const demoController = {
  async demoLogin(req, res, next) {
    try {
      const demoEmail = 'demo@capstonestudio.ai';
      const user = await prisma.user.findUnique({ where: { email: demoEmail } });
      if (!user) {
        return res.status(404).json({ error: 'Demo user not found. Run the demo seed script first.' });
      }
      const result = await authService.login({ email: demoEmail, password: 'demo123456' });
      const project = await prisma.project.findFirst({
        where: { members: { some: { userId: user.id } } },
        select: { id: true, title: true },
      });
      res.json({ ...result, demoProject: project || null });
    } catch (error) {
      next(error);
    }
  },

  async getDemoProject(req, res, next) {
    try {
      const project = await prisma.project.findFirst({
        where: { title: { contains: 'Capstone Studio' } },
        include: {
          members: { include: { user: { select: { id: true, name: true, email: true } } } },
          requirements: {
            include: { acceptanceCriteria: true, testCases: true },
            orderBy: { id: 'asc' },
          },
          tasks: {
            include: { evidence: true, assignee: { select: { id: true, name: true } } },
            orderBy: { id: 'asc' },
          },
          progressLogs: {
            include: { user: { select: { id: true, name: true } } },
            orderBy: { weekNumber: 'asc' },
          },
          peerReviews: {
            include: { reviewer: { select: { id: true, name: true } }, reviewedUser: { select: { id: true, name: true } } },
          },
          files: { orderBy: { uploadedAt: 'desc' } },
          vivaQuestions: {
            include: { answers: { include: { user: { select: { id: true, name: true } } } } },
            orderBy: { id: 'asc' },
          },
          readinessScores: { orderBy: { generatedAt: 'desc' }, take: 1 },
          comments: {
            include: { user: { select: { id: true, name: true } } },
            orderBy: { createdAt: 'desc' },
          },
        },
      });

      if (!project) {
        return res.status(404).json({ error: 'Demo project not found.' });
      }

      res.json(project);
    } catch (error) {
      next(error);
    }
  },
};

export default demoController;
