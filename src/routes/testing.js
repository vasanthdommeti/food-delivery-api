const express = require('express');
const http = require('http');
const env = require('../config/env');
const Vendor = require('../models/Vendor');
const Product = require('../models/Product');
const asyncHandler = require('../utils/asyncHandler');
const { validateObjectId, isNonEmptyString, isPositiveInteger } = require('../utils/validation');

const router = express.Router();

const ensureTestingEnabled = (req, res, next) => {
  if (!env.testEndpointEnabled) {
    return res.status(404).json({
      success: false,
      error: { code: 'NOT_FOUND', message: 'Route not found' },
      requestId: req.id
    });
  }

  if (env.testEndpointToken) {
    const token = req.headers['x-test-token'];
    if (token !== env.testEndpointToken) {
      return res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Invalid test token.' },
        requestId: req.id
      });
    }
  }

  return next();
};

const postJson = (path, body) =>
  new Promise((resolve, reject) => {
    const payload = JSON.stringify(body);
    const request = http.request(
      {
        hostname: '127.0.0.1',
        port: env.port,
        path: `/api/v1${path}`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload)
        }
      },
      (response) => {
        let data = '';
        response.on('data', (chunk) => {
          data += chunk;
        });
        response.on('end', () => {
          let parsed;
          try {
            parsed = data ? JSON.parse(data) : null;
          } catch (err) {
            parsed = data;
          }
          resolve({ status: response.statusCode, body: parsed });
        });
      }
    );

    request.on('error', reject);
    request.write(payload);
    request.end();
  });

const runBurst = async ({ requests, concurrency, payloadFactory }) => {
  const results = new Array(requests);
  let index = 0;

  const worker = async () => {
    while (true) {
      const current = index;
      index += 1;
      if (current >= requests) {
        break;
      }

      try {
        const payload = payloadFactory(current + 1);
        const response = await postJson('/orders', payload);
        results[current] = {
          request: current + 1,
          payload,
          status: response.status,
          response: response.body
        };
      } catch (err) {
        results[current] = {
          request: current + 1,
          status: 0,
          error: err.message
        };
      }
    }
  };

  const workers = Array.from({ length: concurrency }, worker);
  await Promise.all(workers);

  return results;
};

const summarizeResults = (results) => {
  const statusCounts = {};
  const errorCodes = {};

  for (const result of results) {
    const statusKey = String(result.status);
    statusCounts[statusKey] = (statusCounts[statusKey] || 0) + 1;
    const code = result.response?.error?.code;
    if (code) {
      errorCodes[code] = (errorCodes[code] || 0) + 1;
    }
  }

  return {
    total: results.length,
    statusCounts,
    errorCodes
  };
};

router.use(ensureTestingEnabled);

router.post(
  '/rate-limit',
  asyncHandler(async (req, res) => {
    const { vendorId, requests = 150, concurrency = 25, items, includeResponses = false } = req.body || {};

    if (!validateObjectId(vendorId)) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Invalid vendor id.' },
        requestId: req.id
      });
    }

    if (!isPositiveInteger(requests) || requests > 500) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Requests must be an integer between 1 and 500.' },
        requestId: req.id
      });
    }

    if (!isPositiveInteger(concurrency) || concurrency > 100) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Concurrency must be an integer between 1 and 100.' },
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

    const orderItems = Array.isArray(items) && items.length
      ? items
      : [{ name: 'Rate Limit Item', quantity: 1, price: 50 }];

    const results = await runBurst({
      requests,
      concurrency: Math.min(concurrency, requests),
      payloadFactory: (index) => ({
        userId: `rate_test_${index}`,
        vendorId,
        items: orderItems
      })
    });

    const summary = summarizeResults(results);

    res.json({
      success: true,
      data: {
        mode: 'rate-limit',
        vendorId,
        requests,
        concurrency: Math.min(concurrency, requests),
        summary,
        results: includeResponses ? results : undefined
      },
      requestId: req.id
    });
  })
);

router.post(
  '/out-of-stock',
  asyncHandler(async (req, res) => {
    const {
      vendorId,
      productId,
      name,
      price = 120,
      stock = 5,
      requests = 10,
      quantity = 1,
      concurrency = 10,
      includeResponses = false
    } = req.body || {};

    if (!validateObjectId(vendorId)) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Invalid vendor id.' },
        requestId: req.id
      });
    }

    if (!isPositiveInteger(requests) || requests > 500) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Requests must be an integer between 1 and 500.' },
        requestId: req.id
      });
    }

    if (!isPositiveInteger(concurrency) || concurrency > 100) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Concurrency must be an integer between 1 and 100.' },
        requestId: req.id
      });
    }

    if (!isPositiveInteger(quantity)) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Quantity must be a positive integer.' },
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

    let resolvedProductId = productId;
    let createdProduct = null;

    if (resolvedProductId) {
      if (!validateObjectId(resolvedProductId)) {
        return res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Invalid product id.' },
          requestId: req.id
        });
      }
    } else {
      const productName = isNonEmptyString(name) ? name.trim() : `Test Item ${Date.now()}`;
      if (typeof stock !== 'number' || !Number.isInteger(stock) || stock < 0) {
        return res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Stock must be an integer >= 0.' },
          requestId: req.id
        });
      }
      if (typeof price !== 'number' || !Number.isFinite(price) || price <= 0) {
        return res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Price must be a positive number.' },
          requestId: req.id
        });
      }

      createdProduct = await Product.create({
        vendorId,
        name: productName,
        price,
        stock
      });
      resolvedProductId = createdProduct._id.toString();
    }

    const results = await runBurst({
      requests,
      concurrency: Math.min(concurrency, requests),
      payloadFactory: (index) => ({
        userId: `stock_test_${index}`,
        vendorId,
        items: [{ productId: resolvedProductId, quantity }]
      })
    });

    const summary = summarizeResults(results);

    res.json({
      success: true,
      data: {
        mode: 'out-of-stock',
        vendorId,
        productId: resolvedProductId,
        createdProduct,
        requests,
        concurrency: Math.min(concurrency, requests),
        summary,
        results: includeResponses ? results : undefined
      },
      requestId: req.id
    });
  })
);

module.exports = router;
