import { Router } from 'express';
import fileController from '../controllers/file.controller.js';
import { authenticate } from '../middleware/auth.js';
import { requireProjectAccess } from '../middleware/projectAccess.js';
import upload from '../middleware/upload.js';

const router = Router();

router.use(authenticate);

// Upload document under project
router.post(
  '/:id/files/upload',
  requireProjectAccess,
  upload.single('file'),
  fileController.uploadFile
);

// List project documents
router.get('/:id/files', requireProjectAccess, fileController.getProjectFiles);

// Delete file
router.delete('/files/:fileId', fileController.deleteFile);

export default router;
