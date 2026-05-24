import { Router } from 'express';
import projectController from '../controllers/project.controller.js';
import { authenticate } from '../middleware/auth.js';
import { requireProjectAccess } from '../middleware/projectAccess.js';

const router = Router();

router.use(authenticate);

router.post('/', projectController.create);
router.get('/', projectController.list);
router.get('/:id', requireProjectAccess, projectController.getById);
router.put('/:id', requireProjectAccess, projectController.update);
router.delete('/:id', requireProjectAccess, projectController.remove);

export default router;
