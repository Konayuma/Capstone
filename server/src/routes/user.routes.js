import { Router } from 'express';
import userController from '../controllers/user.controller.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

router.get('/search', userController.search);
router.get('/by-role/:role', userController.byRole);
router.get('/:userId', userController.getById);

export default router;
