import prisma from '../config/db.js';

export const memberController = {
  async addMember(req, res, next) {
    try {
      const projectId = parseInt(req.params.id, 10);
      const { email, projectRole } = req.body;

      const user = await prisma.user.findUnique({ where: { email } });
      if (!user) {
        return res.status(404).json({ error: 'User with that email not found.' });
      }

      const existing = await prisma.projectMember.findUnique({
        where: { projectId_userId: { projectId, userId: user.id } },
      });
      if (existing) {
        return res.status(409).json({ error: 'User is already a member of this project.' });
      }

      const member = await prisma.projectMember.create({
        data: { projectId, userId: user.id, projectRole },
        include: { user: { select: { id: true, name: true, email: true } } },
      });

      res.status(201).json(member);
    } catch (error) {
      next(error);
    }
  },

  async listMembers(req, res, next) {
    try {
      const projectId = parseInt(req.params.id, 10);
      const members = await prisma.projectMember.findMany({
        where: { projectId },
        include: { user: { select: { id: true, name: true, email: true, role: true } } },
      });
      res.json(members);
    } catch (error) {
      next(error);
    }
  },

  async updateMember(req, res, next) {
    try {
      const projectId = parseInt(req.params.id, 10);
      const userId = parseInt(req.params.userId, 10);
      const { projectRole, isLeader } = req.body;

      const member = await prisma.projectMember.update({
        where: { projectId_userId: { projectId, userId } },
        data: { projectRole, isLeader },
        include: { user: { select: { id: true, name: true, email: true } } },
      });

      res.json(member);
    } catch (error) {
      next(error);
    }
  },

  async removeMember(req, res, next) {
    try {
      const projectId = parseInt(req.params.id, 10);
      const userId = parseInt(req.params.userId, 10);

      await prisma.projectMember.delete({
        where: { projectId_userId: { projectId, userId } },
      });

      res.json({ message: 'Member removed successfully.' });
    } catch (error) {
      next(error);
    }
  },
};

export default memberController;
