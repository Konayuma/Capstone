import prisma from '../config/db.js';
import crypto from 'crypto';

const memberSelect = {
  user: {
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      profileImage: true,
      createdAt: true,
    },
  },
};

const projectRoles = new Set([
  'project_manager',
  'frontend_dev',
  'backend_dev',
  'fullstack_dev',
  'ui_ux',
  'tester',
  'researcher',
  'doc_lead',
]);

const canManageTeam = (req) => {
  if (req.user.role === 'admin') return true;
  if (req.project?.supervisorId === req.user.id) return true;
  if (req.project?.createdBy === req.user.id) return true;
  return req.projectMember?.isLeader || req.projectMember?.projectRole === 'project_manager';
};

const assertCanManageTeam = (req) => {
  if (!canManageTeam(req)) {
    throw Object.assign(new Error('Only the project manager can manage team membership.'), { status: 403 });
  }
};

const normalizeProjectRole = (role) => {
  if (!role) return null;
  return projectRoles.has(role) ? role : 'researcher';
};

const generateInviteCode = () => {
  const token = crypto.randomBytes(4).toString('hex').toUpperCase();
  return `CAP-${token.slice(0, 4)}-${token.slice(4)}`;
};

export const memberController = {
  async addMember(req, res, next) {
    try {
      assertCanManageTeam(req);
      const projectId = parseInt(req.params.id, 10);
      const { email, userId, projectRole } = req.body;

      const user = userId
        ? await prisma.user.findUnique({ where: { id: parseInt(userId, 10) } })
        : await prisma.user.findUnique({ where: { email } });
      if (!user) {
        return res.status(404).json({ error: 'User not found.' });
      }

      const existing = await prisma.projectMember.findUnique({
        where: { projectId_userId: { projectId, userId: user.id } },
      });
      if (existing) {
        return res.status(409).json({ error: 'User is already a member of this project.' });
      }

      const member = await prisma.projectMember.create({
        data: { projectId, userId: user.id, projectRole: normalizeProjectRole(projectRole) },
        include: memberSelect,
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
        include: memberSelect,
        orderBy: [{ isLeader: 'desc' }, { joinedAt: 'asc' }],
      });
      res.json({ members, canManageTeam: canManageTeam(req) });
    } catch (error) {
      next(error);
    }
  },

  async updateMember(req, res, next) {
    try {
      assertCanManageTeam(req);
      const projectId = parseInt(req.params.id, 10);
      const userId = parseInt(req.params.userId, 10);
      const { projectRole, isLeader } = req.body;

      const existing = await prisma.projectMember.findUnique({
        where: { projectId_userId: { projectId, userId } },
      });
      if (!existing) {
        return res.status(404).json({ error: 'Project member not found.' });
      }

      const leaderCount = await prisma.projectMember.count({
        where: { projectId, isLeader: true },
      });
      if (existing.isLeader && isLeader === false && leaderCount <= 1) {
        return res.status(400).json({ error: 'A project must keep at least one project manager.' });
      }

      const member = await prisma.projectMember.update({
        where: { projectId_userId: { projectId, userId } },
        data: {
          ...(projectRole !== undefined && { projectRole: normalizeProjectRole(projectRole) }),
          ...(isLeader !== undefined && { isLeader: Boolean(isLeader) }),
        },
        include: memberSelect,
      });

      res.json(member);
    } catch (error) {
      next(error);
    }
  },

  async removeMember(req, res, next) {
    try {
      assertCanManageTeam(req);
      const projectId = parseInt(req.params.id, 10);
      const userId = parseInt(req.params.userId, 10);

      if (userId === req.user.id) {
        return res.status(400).json({ error: 'Project managers cannot remove themselves from the team.' });
      }

      const existing = await prisma.projectMember.findUnique({
        where: { projectId_userId: { projectId, userId } },
      });
      if (!existing) {
        return res.status(404).json({ error: 'Project member not found.' });
      }
      if (existing.isLeader) {
        return res.status(400).json({ error: 'Demote this project manager before removing them.' });
      }

      await prisma.projectMember.delete({
        where: { projectId_userId: { projectId, userId } },
      });

      res.json({ message: 'Member removed successfully.' });
    } catch (error) {
      next(error);
    }
  },

  async createInvite(req, res, next) {
    try {
      assertCanManageTeam(req);
      const projectId = parseInt(req.params.id, 10);

      let code = generateInviteCode();
      let attempts = 0;
      while (attempts < 5) {
        const existing = await prisma.teamInvite.findUnique({ where: { code } });
        if (!existing) break;
        code = generateInviteCode();
        attempts += 1;
      }

      const invite = await prisma.teamInvite.create({
        data: {
          projectId,
          code,
          createdBy: req.user.id,
          expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
        },
        include: {
          creator: { select: { id: true, name: true } },
          project: { select: { id: true, title: true } },
        },
      });

      res.status(201).json(invite);
    } catch (error) {
      next(error);
    }
  },

  async listInvites(req, res, next) {
    try {
      assertCanManageTeam(req);
      const projectId = parseInt(req.params.id, 10);
      const invites = await prisma.teamInvite.findMany({
        where: { projectId },
        include: {
          creator: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 8,
      });
      res.json(invites);
    } catch (error) {
      next(error);
    }
  },

  async joinWithInvite(req, res, next) {
    try {
      const code = String(req.params.code || req.body.code || '').trim().toUpperCase();
      if (!code) {
        return res.status(400).json({ error: 'Invite code is required.' });
      }

      const invite = await prisma.teamInvite.findUnique({
        where: { code },
        include: { project: { select: { id: true, title: true } } },
      });

      if (!invite) {
        return res.status(404).json({ error: 'Invite code not found.' });
      }
      if (invite.expiresAt && invite.expiresAt < new Date()) {
        return res.status(410).json({ error: 'This invite code has expired.' });
      }

      const member = await prisma.projectMember.upsert({
        where: { projectId_userId: { projectId: invite.projectId, userId: req.user.id } },
        update: {},
        create: {
          projectId: invite.projectId,
          userId: req.user.id,
          projectRole: 'researcher',
        },
        include: memberSelect,
      });

      await prisma.teamInvite.update({
        where: { id: invite.id },
        data: { usedAt: new Date(), usedBy: req.user.id },
      });

      res.json({ project: invite.project, member });
    } catch (error) {
      next(error);
    }
  },
};

export default memberController;
