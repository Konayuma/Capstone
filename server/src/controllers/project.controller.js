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
  async exportProject(req, res, next) {
    try {
      const projectId = parseInt(req.params.id, 10);

      const project = await prisma.project.findUnique({
        where: { id: projectId },
        include: {
          members: {
            include: { user: { select: { id: true, name: true, email: true, role: true } } },
          },
          requirements: {
            include: {
              acceptanceCriteria: true,
              testCases: true,
            },
          },
          tasks: {
            include: {
              evidence: true,
              assignedToUser: { select: { id: true, name: true } },
            },
          },
          files: true,
          progressLogs: {
            include: { user: { select: { id: true, name: true } } },
          },
          comments: {
            include: { user: { select: { id: true, name: true } } },
          },
          readinessScores: {
            orderBy: { generatedAt: 'desc' },
            take: 1,
          },
        },
      });

      if (!project) {
        return res.status(404).json({ error: 'Project not found.' });
      }

      const exportData = {
        exportedAt: new Date().toISOString(),
        project: {
          id: project.id,
          title: project.title,
          description: project.description,
          category: project.category,
          department: project.department,
          academicYear: project.academicYear,
          status: project.status,
          createdAt: project.createdAt,
        },
        members: project.members.map((m) => ({
          name: m.user.name,
          email: m.user.email,
          role: m.user.role,
          projectRole: m.projectRole,
          isLeader: m.isLeader,
          joinedAt: m.joinedAt,
        })),
        requirements: project.requirements.map((r) => ({
          title: r.title,
          description: r.description,
          type: r.type,
          priority: r.priority,
          status: r.status,
          acceptanceCriteria: r.acceptanceCriteria.map((a) => a.criteriaText),
          testCases: r.testCases.map((t) => ({
            title: t.testTitle,
            description: t.testDescription,
            steps: t.testSteps,
            expected: t.expectedResult,
            status: t.status,
          })),
        })),
        tasks: project.tasks.map((t) => ({
          title: t.title,
          description: t.description,
          status: t.status,
          assignedTo: t.assignedToUser?.name || null,
          deadline: t.deadline,
          completedAt: t.completedAt,
        })),
        files: project.files.map((f) => ({
          fileName: f.fileName || f.originalName,
          fileType: f.fileType,
          uploadedAt: f.uploadedAt,
        })),
        progressLogs: project.progressLogs.map((l) => ({
          user: l.user.name,
          weekNumber: l.weekNumber,
          logText: l.logText,
          submittedAt: l.submittedAt,
        })),
        comments: project.comments.map((c) => ({
          user: c.user.name,
          message: c.message,
          createdAt: c.createdAt,
        })),
        readinessScore: project.readinessScores[0]?.overallScore || null,
      };

      res.json(exportData);
    } catch (error) {
      next(error);
    }
  },

  async dashboardSummary(req, res, next) {
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

      const [projects, latestFiles] = await Promise.all([
        prisma.project.findMany({
          where,
          include: {
            _count: { select: { requirements: true, tasks: true, files: true } },
            requirements: { select: { id: true, status: true } },
            tasks: { select: { id: true, status: true } },
          },
        }),
        prisma.file.findMany({
          where: { project: where },
          include: { project: { select: { id: true, title: true } } },
          orderBy: { uploadedAt: 'desc' },
          take: 5,
        }),
      ]);

      const totalRequirements = projects.reduce((s, p) => s + p._count.requirements, 0);
      const totalTasks = projects.reduce((s, p) => s + p._count.tasks, 0);
      const approvedReqs = projects.reduce((s, p) => s + p.requirements.filter((r) => r.status === 'approved').length, 0);
      const completedTasks = projects.reduce((s, p) => s + p.tasks.filter((t) => t.status === 'completed').length, 0);
      const totalProjects = projects.length;

      res.json({
        totalProjects,
        totalRequirements,
        approvedRequirements: approvedReqs,
        approvalRate: totalRequirements > 0 ? Math.round((approvedReqs / totalRequirements) * 100) : 0,
        totalTasks,
        completedTasks,
        taskCompletionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
        recentUploads: latestFiles.map((f) => ({
          id: f.id,
          fileName: f.fileName || f.originalName,
          projectTitle: f.project.title,
          projectId: f.projectId,
          uploadedAt: f.uploadedAt,
        })),
      });
    } catch (error) {
      next(error);
    }
  },

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
