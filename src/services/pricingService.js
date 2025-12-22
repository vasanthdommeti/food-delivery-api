const roundCurrency = (value) => Math.round((value + Number.EPSILON) * 100) / 100;

const calculateTotals = (items, discountPercent) => {
  const subtotal = roundCurrency(
    items.reduce((sum, item) => sum + item.price * item.quantity, 0)
  );
  const discountAmount = roundCurrency(subtotal * (discountPercent / 100));
  const total = roundCurrency(Math.max(0, subtotal - discountAmount));

  return { subtotal, discountAmount, total };
};

module.exports = { calculateTotals };
