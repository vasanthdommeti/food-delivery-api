const express = require('express');
const Order = require('../models/Order');
const Product = require('../models/Product');
const Vendor = require('../models/Vendor');
const env = require('../config/env');
const { orderLimiter } = require('../middlewares/rateLimiter');
const { getActivePromotion, PROMO_TYPE } = require('../services/promotionService');
const { calculateTotals } = require('../services/pricingService');
const asyncHandler = require('../utils/asyncHandler');
const { isNonEmptyString, validateObjectId, validateItems } = require('../utils/validation');

const router = express.Router();

const releaseInventory = async (reservations) => {
  if (!reservations.length) {
    return;
  }

  const results = await Promise.allSettled(
    reservations.map(({ productId, quantity }) =>
      Product.updateOne({ _id: productId }, { $inc: { stock: quantity } })
    )
  );

  const failures = results.filter((result) => result.status === 'rejected');
  if (failures.length) {
    console.error('Failed to release inventory for some items.');
  }
};

router.post(
  '/',
  ...(env.orderRateLimitEnabled ? [orderLimiter] : []),
  asyncHandler(async (req, res) => {
    const { userId, vendorId, items } = req.body || {};

    if (!isNonEmptyString(userId)) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'User id is required.' },
        requestId: req.id
      });
    }

    if (!validateObjectId(vendorId)) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Invalid vendor id.' },
        requestId: req.id
      });
    }

    const itemsError = validateItems(items);
    if (itemsError) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: itemsError },
        requestId: req.id
      });
    }

    const vendor = await Vendor.findById(vendorId).lean();
    if (!vendor || !vendor.isActive) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Vendor not found or inactive.' },
        requestId: req.id
      });
    }

    if (env.enforceVendorLimit) {
      const since = new Date(Date.now() - 60 * 60 * 1000);
      const orderCount = await Order.countDocuments({ vendorId, createdAt: { $gte: since } });
      if (orderCount >= env.vendorHourlyLimit) {
        return res.status(429).json({
          success: false,
          error: {
            code: 'VENDOR_CAPACITY_REACHED',
            message: 'Vendor order capacity reached for the last hour.'
          },
          requestId: req.id
        });
      }
    }

    const resolvedItems = [];
    const reservations = [];

    for (const item of items) {
      if (item.productId) {
        const updatedProduct = await Product.findOneAndUpdate(
          {
            _id: item.productId,
            vendorId,
            isActive: true,
            stock: { $gte: item.quantity }
          },
          { $inc: { stock: -item.quantity } },
          { new: true }
        ).lean();

        if (!updatedProduct) {
          await releaseInventory(reservations);

          const existingProduct = await Product.findById(item.productId).lean();
          if (!existingProduct || String(existingProduct.vendorId) !== String(vendorId)) {
            return res.status(404).json({
              success: false,
              error: { code: 'PRODUCT_NOT_FOUND', message: 'Product not found for this vendor.' },
              requestId: req.id
            });
          }

          if (!existingProduct.isActive) {
            return res.status(409).json({
              success: false,
              error: { code: 'PRODUCT_INACTIVE', message: 'Product is not available.' },
              requestId: req.id
            });
          }

          return res.status(409).json({
            success: false,
            error: {
              code: 'OUT_OF_STOCK',
              message: 'Insufficient stock for the requested item.',
              details: {
                productId: item.productId,
                availableStock: existingProduct.stock,
                requestedQuantity: item.quantity
              }
            },
            requestId: req.id
          });
        }

        reservations.push({ productId: updatedProduct._id, quantity: item.quantity });
        resolvedItems.push({
          productId: updatedProduct._id,
          name: updatedProduct.name,
          price: updatedProduct.price,
          quantity: item.quantity
        });
      } else {
        resolvedItems.push({
          name: item.name.trim(),
          price: item.price,
          quantity: item.quantity
        });
      }
    }

    const activePromotion = await getActivePromotion();
    const discountPercent = activePromotion ? activePromotion.discountPercent : 0;
    const { subtotal, discountAmount, total } = calculateTotals(resolvedItems, discountPercent);

    const order = await Order.create({
      userId: userId.trim(),
      vendorId,
      items: resolvedItems,
      subtotal,
      discountPercent,
      discountAmount,
      total,
      promotionType: activePromotion ? PROMO_TYPE : undefined,
      status: 'PLACED'
    });

    res.status(201).json({
      success: true,
      data: {
        id: order._id,
        vendorId: order.vendorId,
        userId: order.userId,
        items: order.items,
        subtotal: order.subtotal,
        discountPercent: order.discountPercent,
        discountAmount: order.discountAmount,
        total: order.total,
        promotionType: order.promotionType,
        status: order.status,
        createdAt: order.createdAt
      },
      requestId: req.id
    });
  })
);

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    if (!validateObjectId(id)) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Invalid order id.' },
        requestId: req.id
      });
    }

    const order = await Order.findById(id).lean();
    if (!order) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Order not found.' },
        requestId: req.id
      });
    }

    res.json({
      success: true,
      data: order,
      requestId: req.id
    });
  })
);

module.exports = router;
