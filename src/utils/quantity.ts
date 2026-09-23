export const getQuantityValidationError = (
  quantity: string,
  availableQuantity: number,
): string | null => {
  const trimmed = quantity.trim();
  if (!trimmed) {
    return 'Please enter a quantity.';
  }

  const value = Number(trimmed);
  if (!Number.isInteger(value) || value <= 0) {
    return 'Quantity must be at least 1.';
  }

  if (value > availableQuantity) {
    return `Only ${availableQuantity} available.`;
  }

  return null;
};
