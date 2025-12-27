const express = require('express');
const ordersRouter = require('./orders');
const vendorsRouter = require('./vendors');
const promotionsRouter = require('./promotions');
const productsRouter = require('./products');

const router = express.Router();

router.get('/health', (req, res) => {
  res.json({
    success: true,
    data: {
      status: 'ok',
      uptime: process.uptime(),
      timestamp: new Date().toISOString()
    },
    requestId: req.id
  });
});

router.use('/vendors', vendorsRouter);
router.use('/products', productsRouter);
router.use('/orders', ordersRouter);
router.use('/promotions', promotionsRouter);

module.exports = router;
