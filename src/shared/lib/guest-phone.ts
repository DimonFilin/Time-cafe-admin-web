export function normalizeGuestPhone(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const digits = trimmed.replace(/\D/g, '');
  if (digits.startsWith('375') && digits.length === 12) return `+${digits}`;
  if (digits.startsWith('7') && digits.length === 11) return `+${digits}`;
  if (digits.length === 9 && /^[29]/.test(digits)) return `+375${digits}`;
  return null;
}

export function isValidGuestPhone(raw: string): boolean {
  return normalizeGuestPhone(raw) !== null;
}

export const GUEST_PHONE_HINT = 'Телефон: +375XXXXXXXXX (12 цифр) или +7XXXXXXXXXX (11 цифр)';
