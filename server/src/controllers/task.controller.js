import { z } from 'zod';
import prisma from '../config/db.js';

const taskSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().optional().nullable(),
  assignedTo: z.number().optional().nullable(),
  priority: z.enum(['low', 'medium', 'high']).optional(),
  status: z.enum(['todo', 'in_progress', 'review', 'completed', 'rejected']).optional(),
  deadline: z.string().optional().nullable(),
  requirementId: z.number().optional().nullable(),
});

export const taskController = {
  async getProjectTasks(req, res, next) {
    try {
      const projectId = parseInt(req.params.id || req.params.projectId, 10);
      const tasks = await prisma.task.findMany({
        where: { projectId },
        include: {
          assignee: { select: { id: true, name: true, email: true } },
          requirement: { select: { id: true, title: true } },
          evidence: {
            include: {
              file: { select: { id: true, fileName: true, filePath: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
      res.json(tasks);
    } catch (error) {
      next(error);
    }
  },

  async createTask(req, res, next) {
    try {
      const projectId = parseInt(req.params.id || req.params.projectId, 10);
      const data = taskSchema.parse(req.body);

      const task = await prisma.task.create({
        data: {
          projectId,
          title: data.title,
          description: data.description,
          assignedTo: data.assignedTo || null,
          priority: data.priority || 'medium',
          status: data.status || 'todo',
          deadline: data.deadline ? new Date(data.deadline) : null,
          requirementId: data.requirementId || null,
        },
        include: {
          assignee: { select: { id: true, name: true } },
        },
      });

      res.status(201).json(task);
    } catch (error) {
      next(error);
    }
  },

  async getTaskDetails(req, res, next) {
    try {
      const taskId = parseInt(req.params.taskId, 10);
      const task = await prisma.task.findUnique({
        where: { id: taskId },
        include: {
          assignee: { select: { id: true, name: true, email: true } },
          requirement: { select: { id: true, title: true, type: true } },
          evidence: {
            include: {
              file: true,
            },
          },
        },
      });

      if (!task) {
        return res.status(404).json({ error: 'Task not found.' });
      }
      res.json(task);
    } catch (error) {
      next(error);
    }
  },

  async updateTask(req, res, next) {
    try {
      const taskId = parseInt(req.params.taskId, 10);
      const data = req.body;

      // Handle status changes (update completedAt if completed)
      const updateData = { ...data };
      if (data.status === 'completed') {
        updateData.completedAt = new Date();
      } else if (data.status && data.status !== 'completed') {
        updateData.completedAt = null;
      }

      if (data.deadline) {
        updateData.deadline = new Date(data.deadline);
      }

      const task = await prisma.task.update({
        where: { id: taskId },
        data: updateData,
        include: {
          assignee: { select: { id: true, name: true } },
        },
      });

      res.json(task);
    } catch (error) {
      next(error);
    }
  },

  async deleteTask(req, res, next) {
    try {
      const taskId = parseInt(req.params.taskId, 10);
      await prisma.task.delete({ where: { id: taskId } });
      res.json({ message: 'Task deleted successfully.' });
    } catch (error) {
      next(error);
    }
  },

  // Upload progress evidence for a task
  async submitEvidence(req, res, next) {
    try {
      const taskId = parseInt(req.params.taskId, 10);
      const { fileId, note } = req.body;

      const evidence = await prisma.taskEvidence.create({
        data: {
          taskId,
          fileId: fileId ? parseInt(fileId, 10) : null,
          note: note || '',
        },
        include: {
          file: true,
        },
      });

      res.status(201).json(evidence);
    } catch (error) {
      next(error);
    }
  },
};

export default taskController;
