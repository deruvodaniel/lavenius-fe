/**
 * Returns initials using only first name and last surname:
 * - "Daniel Alejandro De Ruvo" -> "DR"
 * - "Marina" -> "M"
 */
export const getNameInitials = (fullName: string, fallback = '?'): string => {
  const parts = fullName
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length === 0) return fallback;

  const firstInitial = parts[0][0] || '';
  const lastInitial = parts.length > 1 ? parts[parts.length - 1][0] || '' : '';

  return `${firstInitial}${lastInitial}`.toUpperCase() || fallback;
};

