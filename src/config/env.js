const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number.parseInt(process.env.PORT, 10) || 3000,
  mongoUri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/food_delivery_backend',
  discountPercent: Number.parseFloat(process.env.DISCOUNT_PERCENT) || 60,
  discountWindowMinutes: Number.parseInt(process.env.DISCOUNT_WINDOW_MINUTES, 10) || 10,
  vendorHourlyLimit: Number.parseInt(process.env.VENDOR_HOURLY_LIMIT, 10) || 3000,
  enforceVendorLimit: process.env.ENFORCE_VENDOR_LIMIT === 'true'
};

module.exports = env;
