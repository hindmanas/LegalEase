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
  const allowedOrigins = ['http://localhost:5173', 'http://127.0.0.1:5173'];
  if (process.env.CLIENT_URL) {
    const urls = process.env.CLIENT_URL.split(',').map(url => url.replace(/\/$/, '').trim());
    allowedOrigins.push(...urls);
  }
  app.use(
    cors({
      origin: function (origin, callback) {
        if (!origin) return callback(null, true);

        // Allow localhost/127.0.0.1 on any port for local testing/development
        if (/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
          return callback(null, true);
        }

        if (allowedOrigins.includes(origin)) {
          return callback(null, true);
        } else {
          return callback(new Error('Not allowed by CORS'));
        }
      },
      credentials: true
    })
  );
  app.use(express.json({ limit: '1mb' }));
  app.use(morgan('dev'));
  app.get('/', (_req, res) => {
    res.json({
      status: 'success',
      message: 'LegalEase Backend is running 🚀'
    });
  });

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
