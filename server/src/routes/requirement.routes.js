import { Router } from 'express';
import requirementController from '../controllers/requirement.controller.js';
import { authenticate } from '../middleware/auth.js';
import { requireProjectAccess } from '../middleware/projectAccess.js';

const router = Router();

router.use(authenticate);

// Project requirement endpoints
router.get('/:id/requirements', requireProjectAccess, requirementController.getProjectRequirements);
router.post('/:id/requirements', requireProjectAccess, requirementController.createRequirement);
router.post('/:id/requirements/generate', requireProjectAccess, requirementController.generateAIRequirements);
router.get('/:id/requirements/traceability', requireProjectAccess, requirementController.getTraceabilityMatrix);

// Individual requirement endpoints
router.get('/requirements/:requirementId', requirementController.getRequirementDetails);
router.put('/requirements/:requirementId', requirementController.updateRequirement);
router.delete('/requirements/:requirementId', requirementController.deleteRequirement);

// AI triggers for individual requirements
router.post('/requirements/:requirementId/acceptance-criteria/generate', requirementController.generateAcceptanceCriteria);
router.post('/requirements/:requirementId/test-cases/generate', requirementController.generateTestCases);

export default router;
