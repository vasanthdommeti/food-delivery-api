const mongoose = require('mongoose');

const promotionSchema = new mongoose.Schema(
  {
    type: { type: String, required: true, unique: true },
    isActive: { type: Boolean, default: false },
    discountPercent: { type: Number, required: true },
    activatedAt: { type: Date },
    expiresAt: { type: Date }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Promotion', promotionSchema);
