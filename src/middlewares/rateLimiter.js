const rateLimit = require('express-rate-limit');
const env = require('../config/env');

const rateLimitHandler = (req, res) => {
  res.status(429).json({
    success: false,
    error: {
      code: 'RATE_LIMITED',
      message: 'Too many requests, please try again later.'
    },
    requestId: req.id
  });
};

const createLimiter = (options) =>
  rateLimit({
    standardHeaders: true,
    legacyHeaders: false,
    handler: rateLimitHandler,
    ...options
  });

const apiLimiter = createLimiter({
  windowMs: env.rateLimitWindowMs,
  max: env.rateLimitMax
});

const orderLimiter = createLimiter({
  windowMs: env.orderRateLimitWindowMs,
  max: env.orderRateLimitMax
});

module.exports = {
  apiLimiter,
  orderLimiter
};
