const Promotion = require('../models/Promotion');
const env = require('../config/env');

const PROMO_TYPE = 'six-hit';

const normalizePromotion = async (promotion) => {
  if (!promotion) {
    return null;
  }

  if (promotion.isActive && promotion.expiresAt && promotion.expiresAt <= new Date()) {
    const updated = await Promotion.findOneAndUpdate(
      { _id: promotion._id },
      { $set: { isActive: false } },
      { new: true }
    ).lean();
    return updated;
  }

  return promotion;
};

const getPromotion = async () => {
  const promotion = await Promotion.findOne({ type: PROMO_TYPE }).lean();
  return normalizePromotion(promotion);
};

const getActivePromotion = async () => {
  const promotion = await getPromotion();
  if (!promotion || !promotion.isActive) {
    return null;
  }

  return promotion;
};

const activatePromotion = async ({ discountPercent = env.discountPercent, durationMinutes = env.discountWindowMinutes }) => {
  const activatedAt = new Date();
  const expiresAt = new Date(activatedAt.getTime() + durationMinutes * 60 * 1000);

  return Promotion.findOneAndUpdate(
    { type: PROMO_TYPE },
    {
      $set: {
        type: PROMO_TYPE,
        isActive: true,
        discountPercent,
        activatedAt,
        expiresAt
      }
    },
    { upsert: true, new: true }
  );
};

const deactivatePromotion = async () => {
  return Promotion.findOneAndUpdate(
    { type: PROMO_TYPE },
    { $set: { isActive: false } },
    { new: true }
  );
};

module.exports = {
  PROMO_TYPE,
  getPromotion,
  getActivePromotion,
  activatePromotion,
  deactivatePromotion
};
