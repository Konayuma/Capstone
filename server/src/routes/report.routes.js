import { Router } from 'express';
import reportController from '../controllers/report.controller.js';
import { authenticate } from '../middleware/auth.js';
import { requireProjectAccess } from '../middleware/projectAccess.js';

const router = Router();

router.use(authenticate);

// Exporting PDF formats
router.get('/:id/reports/requirements', requireProjectAccess, reportController.exportRequirementsReport);
router.get('/:id/reports/contribution', requireProjectAccess, reportController.exportContributionReport);
router.get('/:id/reports/viva', requireProjectAccess, reportController.exportVivaReport);
router.get('/:id/reports/full', requireProjectAccess, reportController.exportFullReport);

export default router;
