import { z } from 'zod';
import prisma from '../config/db.js';

const createProjectSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  category: z.string().optional(),
  department: z.string().optional(),
  academicYear: z.string().optional(),
  supervisorId: z.number().optional(),
  status: z.enum(['active', 'completed', 'archived', 'draft']).optional(),
});

const canManageProject = (req) => {
  if (req.user.role === 'admin') return true;
  if (req.project?.createdBy === req.user.id) return true;
  if (req.project?.supervisorId === req.user.id) return true;
  if (req.projectMember?.isLeader) return true;
  return req.projectMember?.projectRole === 'project_manager';
};

const assertCanManageProject = (req) => {
  if (!canManageProject(req)) {
    throw Object.assign(new Error('Only the project owner, manager, supervisor, or administrator can change this workspace.'), { status: 403 });
  }
};

export const projectController = {
  async create(req, res, next) {
    try {
      const data = createProjectSchema.parse(req.body);
      const project = await prisma.project.create({
        data: {
          ...data,
          createdBy: req.user.id,
          members: {
            create: {
              userId: req.user.id,
              isLeader: true,
              projectRole: 'project_manager',
            },
          },
        },
        include: { members: { include: { user: { select: { id: true, name: true, email: true } } } } },
      });
      res.status(201).json(project);
    } catch (error) {
      next(error);
    }
  },

  async list(req, res, next) {
    try {
      let where = {};

      if (req.user.role === 'student') {
        where = { members: { some: { userId: req.user.id } } };
      } else if (req.user.role === 'supervisor') {
        where = {
          OR: [
            { supervisorId: req.user.id },
            { members: { some: { userId: req.user.id } } },
          ],
        };
      }
      // admin sees all

      const projects = await prisma.project.findMany({
        where,
        include: {
          creator: { select: { id: true, name: true } },
          supervisor: { select: { id: true, name: true } },
          members: { include: { user: { select: { id: true, name: true, email: true } } } },
          _count: { select: { requirements: true, tasks: true, files: true } },
        },
        orderBy: { createdAt: 'desc' },
      });

      res.json(projects);
    } catch (error) {
      next(error);
    }
  },

  async getById(req, res, next) {
    try {
      const id = parseInt(req.params.id, 10);
      const project = await prisma.project.findUnique({
        where: { id },
        include: {
          creator: { select: { id: true, name: true, email: true } },
          supervisor: { select: { id: true, name: true, email: true } },
          members: { include: { user: { select: { id: true, name: true, email: true, role: true } } } },
          _count: {
            select: { requirements: true, tasks: true, files: true, vivaQuestions: true },
          },
        },
      });

      if (!project) {
        return res.status(404).json({ error: 'Project not found.' });
      }
      res.json(project);
    } catch (error) {
      next(error);
    }
  },

  async update(req, res, next) {
    try {
      assertCanManageProject(req);
      const id = parseInt(req.params.id, 10);
      const data = createProjectSchema.partial().parse(req.body);

      const project = await prisma.project.update({
        where: { id },
        data,
        include: { members: { include: { user: { select: { id: true, name: true, email: true } } } } },
      });
      res.json(project);
    } catch (error) {
      next(error);
    }
  },

  async remove(req, res, next) {
    try {
      assertCanManageProject(req);
      const id = parseInt(req.params.id, 10);
      await prisma.project.delete({ where: { id } });
      res.json({ message: 'Project deleted successfully.' });
    } catch (error) {
      next(error);
    }
  },
};

export default projectController;
