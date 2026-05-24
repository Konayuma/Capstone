import multer from 'multer';
import path from 'path';
import fs from 'fs';
import env from '../config/env.js';

// Ensure upload directory exists
const uploadDir = env.UPLOAD_DIR || './uploads';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer Storage Configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  },
});

// File Type Validation Filter
const fileFilter = (req, file, cb) => {
  const allowedExtensions = [
    '.pdf', '.zip', '.rar', '.docx', '.pptx', '.xlsx',
    '.png', '.jpg', '.jpeg', '.txt', '.json', '.sql',
  ];
  
  const ext = path.extname(file.originalname).toLowerCase();
  
  if (allowedExtensions.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file type. Allowed files: ${allowedExtensions.join(', ')}`), false);
  }
};

// Export pre-configured Multer middleware
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: env.MAX_FILE_SIZE || 20971520, // 20MB
  },
});

export default upload;
