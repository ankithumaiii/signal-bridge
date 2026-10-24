import rateLimit from 'express-rate-limit';

// Standard rate limiter for public API
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again after 15 minutes.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Stricter rate limiter for authentication endpoints
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 40,
  message: {
    success: false,
    message: 'Too many authentication attempts. Please wait 15 minutes before trying again.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Stricter rate limiter for hazard reporting to curb spam
export const reportLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 30,
  message: {
    success: false,
    message: 'Reporting limit reached. Please wait a few minutes before submitting additional reports.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Stricter rate limiter for test message dispatches
export const testLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 20,
  message: {
    success: false,
    message: 'Test notification limit reached. Please wait 10 minutes before sending more test messages.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

