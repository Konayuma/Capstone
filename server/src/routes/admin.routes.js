import { Router } from 'express';
import adminController from '../controllers/admin.controller.js';
import { authenticate } from '../middleware/auth.js';
import { authorize } from '../middleware/authorize.js';

const router = Router();

// Fully protected for admin users only
router.use(authenticate, authorize('admin'));

// Usage statistics
router.get('/stats', adminController.getSystemStats);

// User lists & role management
router.get('/users', adminController.listAllUsers);
router.put('/users/:userId/role', adminController.updateUserRole);
router.delete('/users/:userId', adminController.deleteUser);

export default router;
