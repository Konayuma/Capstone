import fs from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';
import prisma from '../config/db.js';
import env from '../config/env.js';
import supabase from '../config/supabase.js';

const usingSupabaseStorage = Boolean(supabase);

const createStoragePath = (projectId, originalName) => {
  const extension = path.extname(originalName).toLowerCase();
  const baseName = path
    .basename(originalName, extension)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'file';

  return `projects/${projectId}/${Date.now()}-${randomUUID()}-${baseName}${extension}`;
};

const getStoragePathFromPublicUrl = (publicUrl) => {
  if (!publicUrl) {
    return null;
  }

  const bucketPrefix = `/storage/v1/object/public/${env.SUPABASE_BUCKET_NAME}/`;
  const prefixIndex = publicUrl.indexOf(bucketPrefix);
  if (prefixIndex === -1) {
    return null;
  }

  return decodeURIComponent(publicUrl.slice(prefixIndex + bucketPrefix.length));
};

export const fileController = {
  async uploadFile(req, res, next) {
    try {
      const projectId = parseInt(req.params.id || req.params.projectId, 10);
      const fileType = req.body.fileType || 'evidence'; // proposal, report, slides, code, evidence
      
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded.' });
      }

      let storedFilePath;

      if (usingSupabaseStorage) {
        const storagePath = createStoragePath(projectId, req.file.originalname);
        const { error: uploadError } = await supabase.storage
          .from(env.SUPABASE_BUCKET_NAME)
          .upload(storagePath, req.file.buffer, {
            contentType: req.file.mimetype,
            cacheControl: '3600',
            upsert: false,
          });

        if (uploadError) {
          throw Object.assign(new Error(uploadError.message), { status: 502 });
        }

        storedFilePath = supabase.storage
          .from(env.SUPABASE_BUCKET_NAME)
          .getPublicUrl(storagePath).data.publicUrl;
      } else {
        storedFilePath = `/uploads/${req.file.filename}`;
      }

      // Save file details to database
      const dbFile = await prisma.file.create({
        data: {
          projectId,
          uploadedBy: req.user.id,
          fileName: req.file.originalname,
          filePath: storedFilePath,
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

      if (usingSupabaseStorage) {
        const storagePath = getStoragePathFromPublicUrl(fileRecord.filePath);
        if (storagePath) {
          const { error: deleteError } = await supabase.storage
            .from(env.SUPABASE_BUCKET_NAME)
            .remove([storagePath]);

          if (deleteError) {
            throw Object.assign(new Error(deleteError.message), { status: 502 });
          }
        }
      } else {
        // Delete physical file from disk
        const physicalPath = path.join(process.cwd(), fileRecord.filePath);
        if (fs.existsSync(physicalPath)) {
          fs.unlinkSync(physicalPath);
        }
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
