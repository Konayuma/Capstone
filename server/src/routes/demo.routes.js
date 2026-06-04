import { Router } from 'express';
import demoController from '../controllers/demo.controller.js';

const router = Router();

router.post('/login', demoController.demoLogin);
router.get('/project', demoController.getDemoProject);

export default router;
