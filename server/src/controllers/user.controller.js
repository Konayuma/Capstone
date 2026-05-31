import prisma from '../config/db.js';

const publicUserSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  profileImage: true,
  createdAt: true,
};

export const userController = {
  async byRole(req, res, next) {
    try {
      const role = req.params.role;
      if (!['supervisor', 'admin', 'student'].includes(role)) {
        return res.status(400).json({ error: 'Invalid role. Must be supervisor, admin, or student.' });
      }

      const users = await prisma.user.findMany({
        where: { role },
        select: { id: true, name: true, email: true, role: true },
        orderBy: { name: 'asc' },
      });

      res.json(users);
    } catch (error) {
      next(error);
    }
  },

  async search(req, res, next) {
    try {
      const query = String(req.query.q || '').trim();
      if (query.length < 2) {
        return res.json([]);
      }

      const users = await prisma.user.findMany({
        where: {
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { email: { contains: query, mode: 'insensitive' } },
          ],
        },
        select: publicUserSelect,
        orderBy: { name: 'asc' },
        take: 8,
      });

      res.json(users);
    } catch (error) {
      next(error);
    }
  },

  async getById(req, res, next) {
    try {
      const userId = parseInt(req.params.userId, 10);
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          ...publicUserSelect,
          memberships: {
            select: {
              projectRole: true,
              isLeader: true,
              joinedAt: true,
              project: {
                select: {
                  id: true,
                  title: true,
                  status: true,
                  academicYear: true,
                },
              },
            },
            orderBy: { joinedAt: 'desc' },
          },
          assignedTasks: {
            select: { id: true, title: true, status: true, projectId: true },
            orderBy: { createdAt: 'desc' },
            take: 8,
          },
          _count: {
            select: {
              progressLogs: true,
              uploadedFiles: true,
              vivaAnswers: true,
            },
          },
        },
      });

      if (!user) {
        return res.status(404).json({ error: 'User not found.' });
      }

      res.json(user);
    } catch (error) {
      next(error);
    }
  },
};

export default userController;
