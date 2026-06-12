import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import { errorHandler } from './middleware/errorHandler.js';
import authRoutes from './routes/auth.routes.js';
import documentRoutes from './routes/document.routes.js';
import analysisRoutes from './routes/analysis.routes.js';
import chatRoutes from './routes/chat.routes.js';

export function createServer() {
  const app = express();

  app.use(helmet());
  app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173', credentials: true }));
  app.use(express.json({ limit: '1mb' }));
  app.use(morgan('dev'));

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', service: 'legal-ease-api' });
  });

  app.use('/api/auth', authRoutes);
  app.use('/api/documents', documentRoutes);
  app.use('/api/analysis', analysisRoutes);
  app.use('/api/chat', chatRoutes);
  app.use(errorHandler);

  return app;
}
