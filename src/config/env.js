const parseNumber = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? fallback : parsed;
};

const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseNumber(process.env.PORT, 3000),
  mongoUri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/food_delivery_backend',
  mongoMaxPoolSize: parseNumber(process.env.MONGO_MAX_POOL_SIZE, 50),
  discountPercent: Number.parseFloat(process.env.DISCOUNT_PERCENT) || 60,
  discountWindowMinutes: parseNumber(process.env.DISCOUNT_WINDOW_MINUTES, 10),
  vendorHourlyLimit: parseNumber(process.env.VENDOR_HOURLY_LIMIT, 3000),
  enforceVendorLimit: process.env.ENFORCE_VENDOR_LIMIT !== 'false',
  trustProxy: parseNumber(process.env.TRUST_PROXY, 1),
  rateLimitEnabled: process.env.RATE_LIMIT_ENABLED !== 'false',
  rateLimitWindowMs: parseNumber(process.env.RATE_LIMIT_WINDOW_MS, 60 * 1000),
  rateLimitMax: parseNumber(process.env.RATE_LIMIT_MAX, 300),
  orderRateLimitEnabled: process.env.ORDER_RATE_LIMIT_ENABLED !== 'false',
  orderRateLimitWindowMs: parseNumber(process.env.ORDER_RATE_LIMIT_WINDOW_MS, 60 * 1000),
  orderRateLimitMax: parseNumber(process.env.ORDER_RATE_LIMIT_MAX, 120),
  testEndpointEnabled: process.env.TESTING_ENDPOINT_ENABLED === 'true',
  testEndpointToken: process.env.TESTING_ENDPOINT_TOKEN || ''
};

module.exports = env;
