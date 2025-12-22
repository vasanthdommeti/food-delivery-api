const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || err.status || 500;
  const code = err.code || (statusCode >= 500 ? 'INTERNAL_ERROR' : 'BAD_REQUEST');
  const message = err.message || 'Internal server error';
  const details = err.details;

  const payload = {
    success: false,
    error: {
      code,
      message
    },
    requestId: req.id
  };

  if (details) {
    payload.error.details = details;
  }

  res.status(statusCode).json(payload);
};

const notFound = (req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: 'Route not found'
    },
    requestId: req.id
  });
};

module.exports = { errorHandler, notFound };
