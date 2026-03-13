/**
 * Parse unknown monetary value to a safe number.
 * Supports common API formats:
 * - 11111
 * - "11111"
 * - "11111.50"
 * - "11,111.50"
 * - "11.111,50"
 * - "$ 11.111,50"
 */
export function parseAmount(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value !== 'string') {
    return 0;
  }

  const raw = value.trim();
  if (!raw) {
    return 0;
  }

  const cleaned = raw.replace(/[^\d,.-]/g, '');
  const lastComma = cleaned.lastIndexOf(',');
  const lastDot = cleaned.lastIndexOf('.');

  if (lastComma !== -1 && lastDot !== -1) {
    const decimalSeparator = lastComma > lastDot ? ',' : '.';
    const normalized = decimalSeparator === ','
      ? cleaned.replace(/\./g, '').replace(',', '.')
      : cleaned.replace(/,/g, '');
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  if (lastComma !== -1) {
    const normalized = cleaned.replace(/\./g, '').replace(',', '.');
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  const normalized = cleaned.replace(/,/g, '');
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}
