require('dotenv').config();

const app = require('./app');
const env = require('./config/env');
const { connectDb } = require('./config/db');

let server;

const start = async () => {
  try {
    await connectDb();
    server = app.listen(env.port, () => {
      console.log(`Server running on port ${env.port}`);
    });
  } catch (err) {
    console.error('Failed to start server', err);
    process.exit(1);
  }
};

const shutdown = () => {
  if (server) {
    server.close(() => process.exit(0));
  } else {
    process.exit(0);
  }
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

start();
