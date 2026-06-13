export const CAFE_PHONE_REGEX_BY = /^\+375-\d{2}-\d{3}-\d{2}-\d{2}$/;
export const CAFE_PHONE_REGEX_RU = /^\+7-\d{3}-\d{2}-\d{2}-\d{2}$/;
export const CAFE_PHONE_REGEX = /^(\+375-\d{2}-\d{3}-\d{2}-\d{2}|\+7-\d{3}-\d{2}-\d{2}-\d{2})$/;

export const CAFE_PHONE_FORMAT_HINT = '+375-XX-XXX-XX-XX (Беларусь) или +7-XXX-XX-XX-XX (Россия)';

export function isValidCafePhone(phone: string): boolean {
  if (!phone.trim()) return true;
  const t = phone.trim();
  return CAFE_PHONE_REGEX_BY.test(t) || CAFE_PHONE_REGEX_RU.test(t);
}

export function isValidCafeEmail(email: string): boolean {
  if (!email.trim()) return true;
  return (email.match(/@/g) || []).length === 1;
}

function formatRuPhoneInput(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  let d = digits;
  if (d.startsWith('8')) d = `7${d.slice(1)}`;
  if (!d.startsWith('7')) d = `7${d}`;
  d = d.slice(0, 11);
  if (d.length <= 1) return '+7';
  const rest = d.slice(1);
  const a = rest.slice(0, 3);
  const b = rest.slice(3, 5);
  const c = rest.slice(5, 7);
  const e = rest.slice(7, 9);
  let out = `+7-${a}`;
  if (b) out += `-${b}`;
  if (c) out += `-${c}`;
  if (e) out += `-${e}`;
  return out;
}

function formatByPhoneInput(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  let d = digits.startsWith('375') ? digits : `375${digits}`;
  d = d.slice(0, 12);
  if (d.length <= 3) return '+375';
  const rest = d.slice(3);
  const a = rest.slice(0, 2);
  const b = rest.slice(2, 5);
  const c = rest.slice(5, 7);
  const e = rest.slice(7, 9);
  let out = '+375';
  if (a) out += `-${a}`;
  if (b) out += `-${b}`;
  if (c) out += `-${c}`;
  if (e) out += `-${e}`;
  return out;
}

/** Default mask: Belarus (+375); switch to Russia if input starts with +7 */
export function formatPhoneInput(raw: string): string {
  const trimmed = raw.trim();
  if (/^\+?7[\d-]/.test(trimmed) && !trimmed.includes('375')) {
    return formatRuPhoneInput(raw);
  }
  return formatByPhoneInput(raw);
}

export function validateCafeCardFields(values: {
  name: string;
  phone?: string;
  email?: string;
}): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!values.name.trim()) errors.name = 'Укажите название';
  if (values.phone && !isValidCafePhone(values.phone)) {
    errors.phone = `Формат: ${CAFE_PHONE_FORMAT_HINT}`;
  }
  if (values.email && !isValidCafeEmail(values.email)) {
    errors.email = 'В адресе должен быть ровно один символ @';
  }
  return errors;
}
