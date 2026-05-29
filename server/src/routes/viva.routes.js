import { Router } from 'express';
import vivaController from '../controllers/viva.controller.js';
import { authenticate } from '../middleware/auth.js';
import { requireProjectAccess } from '../middleware/projectAccess.js';
import { aiLimiter } from '../middleware/rateLimiter.js';

const router = Router();

router.use(authenticate);

// Generate questions
router.post('/:id/viva/generate', aiLimiter, requireProjectAccess, vivaController.generateVivaQuestions);

// Retrieve all questions
router.get('/:id/viva/questions', requireProjectAccess, vivaController.getVivaQuestions);

// Submit answer for single question
router.post('/:id/viva/questions/:questionId/answer', requireProjectAccess, vivaController.answerVivaQuestion);
router.post('/viva/questions/:questionId/answer', vivaController.answerVivaQuestion);

// Calculate readiness score
router.post('/:id/readiness-score/generate', aiLimiter, requireProjectAccess, vivaController.generateReadinessScore);

// Get current readiness score
router.get('/:id/readiness-score', requireProjectAccess, vivaController.getReadinessScore);

export default router;
