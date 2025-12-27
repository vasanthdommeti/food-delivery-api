const mongoose = require('mongoose');

const isNonEmptyString = (value) => typeof value === 'string' && value.trim().length > 0;
const isPositiveNumber = (value) => typeof value === 'number' && Number.isFinite(value) && value > 0;
const isPositiveInteger = (value) => Number.isInteger(value) && value > 0;

const validateObjectId = (value) => mongoose.Types.ObjectId.isValid(value);

const validateItems = (items) => {
  if (!Array.isArray(items) || items.length === 0) {
    return 'Items must be a non-empty array.';
  }

  for (const item of items) {
    if (!item || typeof item !== 'object') {
      return 'Each item must be an object.';
    }
    if (item.productId) {
      if (!validateObjectId(item.productId)) {
        return 'Item productId must be a valid id.';
      }
    } else if (!isNonEmptyString(item.name)) {
      return 'Item name is required when productId is not provided.';
    }
    if (!isPositiveInteger(item.quantity)) {
      return 'Item quantity must be a positive integer.';
    }
    if (!item.productId && !isPositiveNumber(item.price)) {
      return 'Item price must be a positive number when productId is not provided.';
    }
  }

  return null;
};

module.exports = {
  isNonEmptyString,
  isPositiveNumber,
  isPositiveInteger,
  validateObjectId,
  validateItems
};
