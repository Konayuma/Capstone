import { Router } from 'express';
import taskController from '../controllers/task.controller.js';
import { authenticate } from '../middleware/auth.js';
import { requireProjectAccess } from '../middleware/projectAccess.js';

const router = Router();

router.use(authenticate);

// Project tasks routes
router.get('/:id/tasks', requireProjectAccess, taskController.getProjectTasks);
router.post('/:id/tasks', requireProjectAccess, taskController.createTask);

// Individual task routes
router.get('/tasks/:taskId', taskController.getTaskDetails);
router.put('/tasks/:taskId', taskController.updateTask);
router.delete('/tasks/:taskId', taskController.deleteTask);

// Task evidence uploads
router.post('/tasks/:taskId/evidence', taskController.submitEvidence);

export default router;
