import rateLimit from 'express-rate-limit';

export const compilationRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute window
  max: 60, // Limit each IP to 60 compilation requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many compilation requests from this IP address. Please wait a moment before trying again.',
  },
});
