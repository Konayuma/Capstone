import { Router } from 'express';
import contributionController from '../controllers/contribution.controller.js';
import { authenticate } from '../middleware/auth.js';
import { requireProjectAccess } from '../middleware/projectAccess.js';

const router = Router();

router.use(authenticate);

// Weekly progress logging
router.post('/:id/progress-logs', requireProjectAccess, contributionController.submitProgressLog);
router.get('/:id/progress-logs', requireProjectAccess, contributionController.getProgressLogs);

// Peer reviewing
router.post('/:id/peer-reviews', requireProjectAccess, contributionController.submitPeerReview);

// Final metrics reporting
router.get('/:id/contribution-report', requireProjectAccess, contributionController.getContributionReport);

export default router;
