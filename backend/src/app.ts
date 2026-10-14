import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import * as fs from 'fs';
import * as path from 'path';
import compilerRoutes from './routes/compilerRoutes';
import { errorHandler } from './middleware/errorHandler';

export function createApp(): Application {
  const app: Application = express();

  // Security headers
  app.use(helmet());

  // CORS configuration
  const allowedOrigin = process.env.CORS_ORIGIN || '*';
  app.use(
    cors({
      origin: allowedOrigin === '*' ? '*' : allowedOrigin.split(','),
      methods: ['GET', 'POST', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    })
  );

  // Body parsing limits to prevent DoS attacks
  app.use(express.json({ limit: '128kb' }));
  app.use(express.urlencoded({ extended: true, limit: '128kb' }));

  // API Routes
  app.use('/api', compilerRoutes);

  // Serve production frontend if built
  const frontendDist = path.resolve(__dirname, '../../frontend/dist');
  if (fs.existsSync(frontendDist)) {
    app.use(express.static(frontendDist));
    app.get('*', (req: Request, res: Response, next) => {
      if (req.path.startsWith('/api')) {
        return next();
      }
      res.sendFile(path.join(frontendDist, 'index.html'));
    });
  }

  // 404 Route for unmatched API requests
  app.use((req: Request, res: Response) => {
    res.status(404).json({
      success: false,
      error: `Endpoint '${req.method} ${req.originalUrl}' not found.`,
    });
  });

  // Global Error Handler
  app.use(errorHandler);

  return app;
}
