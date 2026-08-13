/** Strips all non-digit characters, allowing only 0-9. */
export const toDigitsOnly = (value: string): string => value.replace(/\D/g, '');

/**
 * Presentation-only formatter for raw API values.
 * Keeps the original value untouched in state, navigation, and requests.
 */
export const displayValue = (
  value?: string | number | null,
): string | number => {
  if (value === null || value === undefined) {
    return '-';
  }

  if (typeof value === 'string') {
    if (value.trim() === '') {
      return '-';
    }

    return value;
  }

  return value;
};
