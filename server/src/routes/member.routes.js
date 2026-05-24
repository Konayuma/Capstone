import { Router } from 'express';
import memberController from '../controllers/member.controller.js';
import { authenticate } from '../middleware/auth.js';
import { requireProjectAccess } from '../middleware/projectAccess.js';

const router = Router();

router.use(authenticate);

router.post('/:id/members', requireProjectAccess, memberController.addMember);
router.get('/:id/members', requireProjectAccess, memberController.listMembers);
router.put('/:id/members/:userId', requireProjectAccess, memberController.updateMember);
router.delete('/:id/members/:userId', requireProjectAccess, memberController.removeMember);

export default router;
