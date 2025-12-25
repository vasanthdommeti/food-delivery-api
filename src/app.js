const express = require('express');
const compression = require('compression');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const env = require('./config/env');
const routes = require('./routes');
const requestId = require('./middlewares/requestId');
const { apiLimiter } = require('./middlewares/rateLimiter');
const { errorHandler, notFound } = require('./middlewares/errorHandler');

const app = express();

app.set('trust proxy', env.trustProxy);
app.use(requestId);
if (env.rateLimitEnabled) {
  app.use(apiLimiter);
}
app.use(helmet());
app.use(cors());
app.use(compression());
app.use(express.json({ limit: '1mb' }));
app.use(morgan('combined'));

app.use('/api/v1', routes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
