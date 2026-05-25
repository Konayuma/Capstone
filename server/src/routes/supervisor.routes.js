import { Router } from 'express';
import supervisorController from '../controllers/supervisor.controller.js';
import { authenticate } from '../middleware/auth.js';
import { requireProjectAccess } from '../middleware/projectAccess.js';

const router = Router();

router.use(authenticate);

router.get('/assigned/projects', supervisorController.listAssignedProjects);
router.get('/assigned/overview', supervisorController.getOverview);

// Project comment endpoints
router.post('/:id/comments', requireProjectAccess, supervisorController.addComment);
router.get('/:id/comments', requireProjectAccess, supervisorController.getComments);
router.delete('/comments/:commentId', supervisorController.deleteComment);

export default router;
