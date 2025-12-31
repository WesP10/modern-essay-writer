import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import dotenv from 'dotenv';
import { logger } from './utils/logger.js';
import { errorHandler } from './middleware/errorHandler.js';
import { testFirestoreConnection } from './config/firebase.js';

// Import routes
import authRoutes from './routes/auth.js';
import essayRoutes from './routes/essays.js';
import autocompleteRoutes from './routes/ai/autocomplete.js';
import detectRoutes from './routes/ai/detect.js';
import humanizeRoutes from './routes/ai/humanize.js';
import generateRoutes from './routes/ai/generate.js';
import citationsRoutes from './routes/ai/citations.js';
import sessionRoutes from './routes/ai/session.js';
import adminRoutes from './routes/admin.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet()); // Security headers
app.use(compression()); // Response compression
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('user-agent')
  });
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/essays', essayRoutes);
app.use('/api/ai/autocomplete', autocompleteRoutes);
app.use('/api/ai/detect', detectRoutes);
app.use('/api/ai/humanize', humanizeRoutes);
app.use('/api/ai/generate', generateRoutes);
app.use('/api/ai/citations', citationsRoutes);
app.use('/api/ai/session', sessionRoutes);
app.use('/api/admin', adminRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} not found`,
    timestamp: new Date().toISOString()
  });
});

// Global error handler (must be last)
app.use(errorHandler);

// Start server only if run directly
if (process.argv[1] === import.meta.filename || process.argv[1].endsWith('server.js')) {
  app.listen(PORT, async () => {
    logger.info(`🚀 EssayForge Backend running on port ${PORT}`);
    logger.info(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
    logger.info(`🤖 Ollama URL: ${process.env.OLLAMA_BASE_URL || 'http://localhost:11434'}`);
    logger.info(`🔗 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);

    // Test Firebase connection
    await testFirestoreConnection();
  });
}

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully...');
  process.exit(0);
});

export default app;
