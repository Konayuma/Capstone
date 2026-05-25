import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import helmet from 'helmet';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import env from './config/env.js';
import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/user.routes.js';
import projectRoutes from './routes/project.routes.js';
import memberRoutes from './routes/member.routes.js';
import requirementRoutes from './routes/requirement.routes.js';
import taskRoutes from './routes/task.routes.js';
import contributionRoutes from './routes/contribution.routes.js';
import fileRoutes from './routes/file.routes.js';
import vivaRoutes from './routes/viva.routes.js';
import reportRoutes from './routes/report.routes.js';
import supervisorRoutes from './routes/supervisor.routes.js';
import adminRoutes from './routes/admin.routes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Security
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));

// CORS
app.use(cors({
  origin: env.NODE_ENV === 'production'
    ? env.CLIENT_URL
    : (origin, callback) => {
        const allowed = !origin
          || /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);

        callback(null, allowed);
      },
  credentials: true,
}));

// Logging
if (env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Static files for uploads
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/projects', memberRoutes);
app.use('/api/projects', requirementRoutes);
app.use('/api/projects', taskRoutes);
app.use('/api/projects', contributionRoutes);
app.use('/api/projects', fileRoutes);
app.use('/api/projects', vivaRoutes);
app.use('/api/projects', reportRoutes);
app.use('/api/projects', supervisorRoutes);
app.use('/api/admin', adminRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Server Error:', err);

  if (err.name === 'ZodError') {
    return res.status(400).json({
      error: 'Validation error',
      details: err.errors,
    });
  }

  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({
      error: 'File too large',
      message: `Maximum file size is ${env.MAX_FILE_SIZE / (1024 * 1024)}MB`,
    });
  }

  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    ...(env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

const isDirectExecution = process.argv[1]
  && pathToFileURL(process.argv[1]).href === import.meta.url;

if (isDirectExecution) {
  app.listen(env.PORT, () => {
    console.log(`\n  CapstoneGuard AI Server`);
    console.log(`  Environment: ${env.NODE_ENV}`);
    console.log(`  Listening on: http://localhost:${env.PORT}`);
    console.log(`  API docs: http://localhost:${env.PORT}/api/health\n`);
  });
}

export default app;
