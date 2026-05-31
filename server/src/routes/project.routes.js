import { Router } from 'express';
import projectController from '../controllers/project.controller.js';
import githubController from '../controllers/github.controller.js';
import { authenticate } from '../middleware/auth.js';
import { requireProjectAccess } from '../middleware/projectAccess.js';

const router = Router();

router.use(authenticate);

router.post('/', projectController.create);
router.get('/', projectController.list);
router.get('/dashboard-summary', projectController.dashboardSummary);
router.get('/:id', requireProjectAccess, projectController.getById);
router.put('/:id', requireProjectAccess, projectController.update);
router.get('/:id/github', requireProjectAccess, githubController.getProjectIntegration);
router.get('/:id/github/install-url', requireProjectAccess, githubController.getAppInstallUrl);
router.put('/:id/github', requireProjectAccess, githubController.updateProjectIntegration);
router.post('/:id/github/sync', requireProjectAccess, githubController.syncProjectRepository);
router.delete('/:id/github', requireProjectAccess, githubController.disconnectProjectRepository);
router.delete('/:id', requireProjectAccess, projectController.remove);

export default router;
