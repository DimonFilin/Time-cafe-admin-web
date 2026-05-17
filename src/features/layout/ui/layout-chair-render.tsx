import type { ChairVariant } from './layout-editor-catalog';
import type { PlanChair } from './layout-furniture';
import { furnitureBoundsPx, furnitureTransform } from './layout-furniture';

export function ChairShape({
  chair,
  pxPerMeter,
  active,
  delFlash,
  conflict,
}: {
  chair: PlanChair;
  pxPerMeter: number;
  active?: boolean;
  delFlash?: boolean;
  conflict?: boolean;
}) {
  const b = furnitureBoundsPx(chair, pxPerMeter);
  const fill =
    delFlash || conflict
      ? 'rgba(220,38,38,0.35)'
      : active
        ? 'rgba(234,88,12,0.22)'
        : 'rgba(87,83,78,0.35)';
  const stroke = delFlash || conflict ? '#dc2626' : active ? '#ea580c' : '#57534e';
  const tf = furnitureTransform(chair);
  const v: ChairVariant = chair.variant || 'standard';

  if (v === 'bar') {
    return (
      <g transform={tf}>
        <rect
          x={b.x + b.w * 0.35}
          y={b.y + b.h * 0.35}
          width={b.w * 0.3}
          height={b.h * 0.65}
          rx={3}
          fill={fill}
          stroke={stroke}
          strokeWidth={1.5}
        />
        <rect
          x={b.x + b.w * 0.42}
          y={b.y + b.h * 0.08}
          width={b.w * 0.16}
          height={b.h * 0.3}
          fill={fill}
          stroke={stroke}
          strokeWidth={1.2}
        />
      </g>
    );
  }
  if (v === 'office') {
    return (
      <g transform={tf}>
        <rect
          x={b.x + b.w * 0.15}
          y={b.y + b.h * 0.55}
          width={b.w * 0.7}
          height={b.h * 0.12}
          rx={2}
          fill={fill}
          stroke={stroke}
          strokeWidth={1.2}
        />
        <rect
          x={b.x + b.w * 0.22}
          y={b.y + b.h * 0.2}
          width={b.w * 0.56}
          height={b.h * 0.38}
          rx={5}
          fill={fill}
          stroke={stroke}
          strokeWidth={1.8}
        />
        <rect
          x={b.x + b.w * 0.08}
          y={b.y + b.h * 0.28}
          width={b.w * 0.14}
          height={b.h * 0.22}
          rx={3}
          fill={fill}
          stroke={stroke}
          strokeWidth={1.2}
        />
      </g>
    );
  }
  if (v === 'pouf') {
    const cx = chair.x;
    const cy = chair.y;
    const r = Math.min(b.w, b.h) / 2;
    return (
      <g transform={tf}>
        <circle cx={cx} cy={cy} r={r} fill={fill} stroke={stroke} strokeWidth={1.8} />
        <path
          d={`M ${cx - r * 0.5} ${cy - r * 0.2} A ${r * 0.55} ${r * 0.55} 0 0 1 ${cx + r * 0.35} ${cy - r * 0.35}`}
          fill="none"
          stroke={stroke}
          strokeWidth={1.4}
        />
      </g>
    );
  }
  const seatH = b.h * 0.55;
  return (
    <g transform={tf}>
      <rect
        x={b.x + b.w * 0.12}
        y={b.y + b.h * 0.08}
        width={b.w * 0.76}
        height={b.h * 0.22}
        rx={3}
        fill={fill}
        stroke={stroke}
        strokeWidth={1.5}
      />
      <rect
        x={b.x + b.w * 0.18}
        y={b.y + b.h * 0.3}
        width={b.w * 0.64}
        height={seatH}
        rx={4}
        fill={fill}
        stroke={stroke}
        strokeWidth={delFlash || conflict ? 3 : 2}
      />
    </g>
  );
}
