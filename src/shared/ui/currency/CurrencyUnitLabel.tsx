import { cn } from '@/shared/lib/cn';
import { BelarussianRubelIcon } from './BelarussianRubelIcon';

/** Standard glyph size — matches MoneyAmount (tall Belarusian ruble sign from SVG). */
export const BYN_ICON_CLASS = 'inline shrink-0 h-[1.05em] w-[0.85em]';

/** Belarusian ruble SVG symbol + unit suffix, e.g. icon + «/час». */
export function CurrencyUnitLabel({
  unit,
  className,
  iconClassName,
}: {
  unit: string;
  className?: string;
  iconClassName?: string;
}) {
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
      <span>/{unit}</span>
    </span>
  );
}
