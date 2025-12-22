const express = require('express');
const asyncHandler = require('../utils/asyncHandler');
const { getPromotion, activatePromotion, deactivatePromotion, PROMO_TYPE } = require('../services/promotionService');

const router = express.Router();

router.get(
  '/six-hit',
  asyncHandler(async (req, res) => {
    const promotion = await getPromotion();

    res.json({
      success: true,
      data: promotion
        ? {
            type: PROMO_TYPE,
            isActive: promotion.isActive,
            discountPercent: promotion.discountPercent,
            activatedAt: promotion.activatedAt,
            expiresAt: promotion.expiresAt
          }
        : {
            type: PROMO_TYPE,
            isActive: false
          },
      requestId: req.id
    });
  })
);

router.post(
  '/six-hit/activate',
  asyncHandler(async (req, res) => {
    const { discountPercent, durationMinutes } = req.body || {};

    if (discountPercent !== undefined && (typeof discountPercent !== 'number' || discountPercent <= 0)) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Discount percent must be a positive number.' },
        requestId: req.id
      });
    }

    if (durationMinutes !== undefined && (typeof durationMinutes !== 'number' || durationMinutes <= 0)) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Duration minutes must be a positive number.' },
        requestId: req.id
      });
    }

    const promotion = await activatePromotion({ discountPercent, durationMinutes });

    res.json({
      success: true,
      data: {
        type: PROMO_TYPE,
        isActive: promotion.isActive,
        discountPercent: promotion.discountPercent,
        activatedAt: promotion.activatedAt,
        expiresAt: promotion.expiresAt
      },
      requestId: req.id
    });
  })
);

router.post(
  '/six-hit/deactivate',
  asyncHandler(async (req, res) => {
    const promotion = await deactivatePromotion();

    res.json({
      success: true,
      data: {
        type: PROMO_TYPE,
        isActive: promotion ? promotion.isActive : false
      },
      requestId: req.id
    });
  })
);

module.exports = router;
