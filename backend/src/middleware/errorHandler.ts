import { Request, Response, NextFunction } from 'express';

export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) {
  console.error('[API Error]:', err.message || err);

  const status = err.status || err.statusCode || 500;
  res.status(status).json({
    success: false,
    error: err.message || 'An unexpected internal server error occurred',
    timestamp: new Date().toISOString(),
  });
}
