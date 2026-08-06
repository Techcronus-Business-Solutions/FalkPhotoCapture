/** Strips all non-digit characters, allowing only 0-9. */
export const toDigitsOnly = (value: string): string =>
  value.replace(/\D/g, '');
