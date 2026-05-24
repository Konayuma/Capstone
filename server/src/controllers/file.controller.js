import fs from 'fs';
import path from 'path';
import prisma from '../config/db.js';

export const fileController = {
  async uploadFile(req, res, next) {
    try {
      const projectId = parseInt(req.params.id || req.params.projectId, 10);
      const fileType = req.body.fileType || 'evidence'; // proposal, report, slides, code, evidence
      
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded.' });
      }

      // Save file details to database
      const dbFile = await prisma.file.create({
        data: {
          projectId,
          uploadedBy: req.user.id,
          fileName: req.file.originalname,
          filePath: `/uploads/${req.file.filename}`, // web-accessible path
          fileType,
          mimeType: req.file.mimetype,
          size: req.file.size,
        },
        include: {
          uploader: { select: { id: true, name: true } },
        },
      });

      res.status(201).json(dbFile);
    } catch (error) {
      next(error);
    }
  },

  async getProjectFiles(req, res, next) {
    try {
      const projectId = parseInt(req.params.id || req.params.projectId, 10);
      const files = await prisma.file.findMany({
        where: { projectId },
        include: {
          uploader: { select: { id: true, name: true, email: true } },
        },
        orderBy: { uploadedAt: 'desc' },
      });
      res.json(files);
    } catch (error) {
      next(error);
    }
  },

  async deleteFile(req, res, next) {
    try {
      const fileId = parseInt(req.params.fileId, 10);
      
      const fileRecord = await prisma.file.findUnique({
        where: { id: fileId },
      });

      if (!fileRecord) {
        return res.status(404).json({ error: 'File not found.' });
      }

      // Check access permission (creator, supervisor or admin)
      if (req.user.id !== fileRecord.uploadedBy && req.user.role !== 'admin' && req.user.role !== 'supervisor') {
        return res.status(403).json({ error: 'You do not have permission to delete this file.' });
      }

      // Delete physical file from disk
      const physicalPath = path.join(process.cwd(), fileRecord.filePath);
      if (fs.existsSync(physicalPath)) {
        fs.unlinkSync(physicalPath);
      }

      // Delete from database
      await prisma.file.delete({
        where: { id: fileId },
      });

      res.json({ message: 'File deleted successfully.' });
    } catch (error) {
      next(error);
    }
  },
};

export default fileController;
