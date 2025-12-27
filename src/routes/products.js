const express = require('express');
const Product = require('../models/Product');
const Vendor = require('../models/Vendor');
const asyncHandler = require('../utils/asyncHandler');
const { isNonEmptyString, isPositiveNumber, validateObjectId } = require('../utils/validation');

const router = express.Router();

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const { vendorId, name, price, stock } = req.body || {};

    if (!validateObjectId(vendorId)) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Invalid vendor id.' },
        requestId: req.id
      });
    }

    if (!isNonEmptyString(name)) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Product name is required.' },
        requestId: req.id
      });
    }

    if (!isPositiveNumber(price)) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Product price must be a positive number.' },
        requestId: req.id
      });
    }

    if (typeof stock !== 'number' || !Number.isInteger(stock) || stock < 0) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Product stock must be an integer >= 0.' },
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

    try {
      const product = await Product.create({
        vendorId,
        name: name.trim(),
        price,
        stock
      });

      res.status(201).json({
        success: true,
        data: product,
        requestId: req.id
      });
    } catch (err) {
      if (err.code === 11000) {
        return res.status(409).json({
          success: false,
          error: { code: 'CONFLICT', message: 'Product name already exists for this vendor.' },
          requestId: req.id
        });
      }
      throw err;
    }
  })
);

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const query = {};
    if (req.query.vendorId && validateObjectId(req.query.vendorId)) {
      query.vendorId = req.query.vendorId;
    }

    const products = await Product.find(query).sort({ createdAt: -1 }).lean();

    res.json({
      success: true,
      data: products,
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
        error: { code: 'VALIDATION_ERROR', message: 'Invalid product id.' },
        requestId: req.id
      });
    }

    const product = await Product.findById(id).lean();
    if (!product) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Product not found.' },
        requestId: req.id
      });
    }

    res.json({
      success: true,
      data: product,
      requestId: req.id
    });
  })
);

router.patch(
  '/:id/stock',
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { stock } = req.body || {};

    if (!validateObjectId(id)) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Invalid product id.' },
        requestId: req.id
      });
    }

    if (typeof stock !== 'number' || !Number.isInteger(stock) || stock < 0) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Stock must be an integer >= 0.' },
        requestId: req.id
      });
    }

    const product = await Product.findByIdAndUpdate(
      id,
      { $set: { stock } },
      { new: true }
    ).lean();

    if (!product) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Product not found.' },
        requestId: req.id
      });
    }

    res.json({
      success: true,
      data: product,
      requestId: req.id
    });
  })
);

module.exports = router;
