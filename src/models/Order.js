const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    name: { type: String, required: true, trim: true },
    quantity: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true, min: 0 }
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, index: true },
    vendorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor', required: true, index: true },
    items: { type: [itemSchema], required: true },
    subtotal: { type: Number, required: true },
    discountPercent: { type: Number, required: true },
    discountAmount: { type: Number, required: true },
    total: { type: Number, required: true },
    promotionType: { type: String },
    status: { type: String, default: 'PLACED' }
  },
  { timestamps: true }
);

orderSchema.index({ vendorId: 1, createdAt: -1 });

module.exports = mongoose.model('Order', orderSchema);
