import fs from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';
import prisma from '../config/db.js';
import env from '../config/env.js';
import supabase from '../config/supabase.js';
import { generateTextContent } from '../ai/nvidia.js';

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

const getLocalUploadPath = (filePath) => path.join(process.cwd(), filePath.replace(/^\/+/, ''));

const assertFileAccess = async (req, fileId) => {
  const fileRecord = await prisma.file.findUnique({
    where: { id: fileId },
    include: {
      project: {
        include: { members: true },
      },
    },
  });

  if (!fileRecord) {
    throw Object.assign(new Error('File not found.'), { status: 404 });
  }

  const hasAccess = req.user.role === 'admin'
    || fileRecord.project.supervisorId === req.user.id
    || fileRecord.project.members.some((member) => member.userId === req.user.id);

  if (!hasAccess) {
    throw Object.assign(new Error('You do not have access to this file.'), { status: 403 });
  }

  return fileRecord;
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

  async analyzeProjectFiles(req, res, next) {
    try {
      const projectId = parseInt(req.params.id || req.params.projectId, 10);
      const project = await prisma.project.findUnique({
        where: { id: projectId },
        include: {
          files: {
            include: {
              uploader: { select: { name: true, role: true } },
            },
            orderBy: { uploadedAt: 'desc' },
          },
          requirements: {
            select: { title: true, type: true, status: true },
          },
        },
      });

      if (!project) {
        return res.status(404).json({ error: 'Project not found.' });
      }

      if (project.files.length === 0) {
        return res.status(400).json({ error: 'Upload project documents before running analysis.' });
      }

      const fileSummary = project.files
        .map((file) => `- ${file.fileType}: ${file.fileName}, ${file.size || 0} bytes, uploaded by ${file.uploader?.name || 'unknown'}`)
        .join('\n');
      const requirementSummary = project.requirements
        .map((requirement) => `- [${requirement.type}] ${requirement.title} (${requirement.status})`)
        .join('\n') || 'No requirements recorded.';

      const analysis = await generateTextContent(
        `Analyze this capstone project's uploaded document set and identify quality gaps, missing artifacts, and viva preparation risks.

Project: ${project.title}
Description: ${project.description}

Uploaded files:
${fileSummary}

Requirements:
${requirementSummary}

Return the review in clean markdown only, using:
- One heading per section with ##
- Short bullet points under each heading
- No long paragraphs
- No numbered essay format

Use these sections in this order:
## Document completeness
## Testing and evidence gaps
## Viva defense risks
## Recommended next uploads or fixes`,
  'You are a strict capstone supervisor reviewing document completeness and evidence quality. Respond in clean markdown with headings and bullet points only.'
      );

      res.json({ analysis, fileCount: project.files.length });
    } catch (error) {
      next(error);
    }
  },

  async deleteFile(req, res, next) {
    try {
      const fileId = parseInt(req.params.fileId, 10);
      const fileRecord = await assertFileAccess(req, fileId);

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
        const physicalPath = getLocalUploadPath(fileRecord.filePath);
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

  async downloadFile(req, res, next) {
    try {
      const fileId = parseInt(req.params.fileId, 10);
      const fileRecord = await assertFileAccess(req, fileId);

      if (fileRecord.filePath?.startsWith('http')) {
        return res.redirect(fileRecord.filePath);
      }

      const physicalPath = getLocalUploadPath(fileRecord.filePath);
      if (!fs.existsSync(physicalPath)) {
        return res.status(404).json({ error: 'Stored file not found.' });
      }

      res.download(physicalPath, fileRecord.fileName);
    } catch (error) {
      next(error);
    }
  },
};

export default fileController;
