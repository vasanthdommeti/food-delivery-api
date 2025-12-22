const { v4: uuidv4 } = require('uuid');

const requestId = (req, res, next) => {
  const headerId = req.headers['x-request-id'];
  const id = typeof headerId === 'string' && headerId.trim() ? headerId.trim() : uuidv4();
  req.id = id;
  res.setHeader('x-request-id', id);
  next();
};

module.exports = requestId;
