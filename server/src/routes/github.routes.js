import { Router } from 'express';
import githubController from '../controllers/github.controller.js';

const router = Router();

router.post('/webhook', githubController.handleWebhook);

export default router;
