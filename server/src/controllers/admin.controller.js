import prisma from '../config/db.js';

export const adminController = {
  // 1. Get platform-wide usage metrics
  async getSystemStats(req, res, next) {
    try {
      const usersCount = await prisma.user.count();
      const projectsCount = await prisma.project.count();
      const filesCount = await prisma.file.count();
      const requirementsCount = await prisma.requirement.count();
      const tasksCount = await prisma.task.count();

      const roleBreakdown = await prisma.user.groupBy({
        by: ['role'],
        _count: { id: true },
      });

      const categoryBreakdown = await prisma.project.groupBy({
        by: ['category'],
        _count: { id: true },
      });

      res.json({
        totals: {
          users: usersCount,
          projects: projectsCount,
          files: filesCount,
          requirements: requirementsCount,
          tasks: tasksCount,
        },
        roles: roleBreakdown,
        categories: categoryBreakdown,
      });
    } catch (error) {
      next(error);
    }
  },

  // 2. Manage users
  async listAllUsers(req, res, next) {
    try {
      const users = await prisma.user.findMany({
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
      });
      res.json(users);
    } catch (error) {
      next(error);
    }
  },

  async updateUserRole(req, res, next) {
    try {
      const userId = parseInt(req.params.userId, 10);
      const { role } = req.body;

      if (!['student', 'supervisor', 'admin'].includes(role)) {
        return res.status(400).json({ error: 'Invalid user role.' });
      }

      const user = await prisma.user.update({
        where: { id: userId },
        data: { role },
        select: { id: true, name: true, email: true, role: true },
      });

      res.json(user);
    } catch (error) {
      next(error);
    }
  },

  async deleteUser(req, res, next) {
    try {
      const userId = parseInt(req.params.userId, 10);
      
      if (req.user.id === userId) {
        return res.status(400).json({ error: 'You cannot delete your own admin account.' });
      }

      await prisma.user.delete({ where: { id: userId } });
      res.json({ message: 'User account deleted successfully.' });
    } catch (error) {
      next(error);
    }
  },
};

export default adminController;
