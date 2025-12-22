const express = require('express');
const Vendor = require('../models/Vendor');
const Order = require('../models/Order');
const asyncHandler = require('../utils/asyncHandler');
const { isNonEmptyString, validateObjectId } = require('../utils/validation');

const router = express.Router();

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const { name } = req.body || {};

    if (!isNonEmptyString(name)) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Vendor name is required.' },
        requestId: req.id
      });
    }

    const vendor = await Vendor.create({ name: name.trim() });

    res.status(201).json({
      success: true,
      data: vendor,
      requestId: req.id
    });
  })
);

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const vendors = await Vendor.find({}).sort({ createdAt: -1 }).lean();

    res.json({
      success: true,
      data: vendors,
      requestId: req.id
    });
  })
);

router.get(
  '/:id/metrics',
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const windowMinutes = Number.parseInt(req.query.windowMinutes, 10) || 60;

    if (!validateObjectId(id)) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Invalid vendor id.' },
        requestId: req.id
      });
    }

    const vendor = await Vendor.findById(id).lean();
    if (!vendor) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Vendor not found.' },
        requestId: req.id
      });
    }

    const since = new Date(Date.now() - windowMinutes * 60 * 1000);
    const orderCount = await Order.countDocuments({ vendorId: id, createdAt: { $gte: since } });

    res.json({
      success: true,
      data: {
        vendorId: id,
        windowMinutes,
        orderCount
      },
      requestId: req.id
    });
  })
);

module.exports = router;
