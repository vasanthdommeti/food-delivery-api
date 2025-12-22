const mongoose = require('mongoose');

const isNonEmptyString = (value) => typeof value === 'string' && value.trim().length > 0;
const isPositiveNumber = (value) => typeof value === 'number' && Number.isFinite(value) && value > 0;

const validateObjectId = (value) => mongoose.Types.ObjectId.isValid(value);

const validateItems = (items) => {
  if (!Array.isArray(items) || items.length === 0) {
    return 'Items must be a non-empty array.';
  }

  for (const item of items) {
    if (!item || typeof item !== 'object') {
      return 'Each item must be an object.';
    }
    if (!isNonEmptyString(item.name)) {
      return 'Item name is required.';
    }
    if (!isPositiveNumber(item.quantity)) {
      return 'Item quantity must be a positive number.';
    }
    if (!isPositiveNumber(item.price)) {
      return 'Item price must be a positive number.';
    }
  }

  return null;
};

module.exports = {
  isNonEmptyString,
  isPositiveNumber,
  validateObjectId,
  validateItems
};
