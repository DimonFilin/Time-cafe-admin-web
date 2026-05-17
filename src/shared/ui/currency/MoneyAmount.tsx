import type { ReactNode } from 'react';
import { cn } from '@/shared/lib/cn';
import { BelarussianRubelIcon } from './BelarussianRubelIcon';
import { BYN_ICON_CLASS } from './CurrencyUnitLabel';

function formatAmount(value: string | number, fractionDigits: number): string {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value.toFixed(fractionDigits);
  }
  const n = Number.parseFloat(String(value).replace(',', '.'));
  if (Number.isFinite(n)) return n.toFixed(fractionDigits);
  return String(value);
}

/**
 * Amount with Belarusian ruble SVG symbol (BelarussianRubelIcon). Use for all monetary values in the admin UI.
 */
export function MoneyAmount({
  value,
  className,
  iconClassName,
  fractionDigits = 2,
  suffix,
}: {
  value: string | number;
  className?: string;
  iconClassName?: string;
  fractionDigits?: number;
  suffix?: ReactNode;
}) {
  const text = formatAmount(value, fractionDigits);
  return (
    <span
      className={cn('inline-flex items-center gap-0.5 align-middle', className)}
      title="Белорусский рубль"
    >
      <BelarussianRubelIcon
        className={cn(BYN_ICON_CLASS, 'text-[rgb(var(--tc-fg))]', iconClassName)}
        role="img"
        aria-label="Символ белорусского рубля"
      />
      <span className="tabular-nums">{text}</span>
      {suffix != null ? <span className="tabular-nums">{suffix}</span> : null}
    </span>
  );
}
