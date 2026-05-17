import { furnitureBoundsPx, furnitureTransform } from './layout-furniture';
import type { PlanFixture } from './layout-fixtures';

export function FixtureShape({
  f,
  pxPerMeter,
  active,
  delFlash,
}: {
  f: PlanFixture;
  pxPerMeter: number;
  active?: boolean;
  delFlash?: boolean;
}) {
  const b = furnitureBoundsPx(f, pxPerMeter);
  const stroke = delFlash ? '#dc2626' : active ? '#ea580c' : '#374151';
  const fill = delFlash
    ? 'rgba(220,38,38,0.35)'
    : active
      ? 'rgba(234,88,12,0.15)'
      : 'rgba(255,255,255,0.95)';
  const tf = furnitureTransform(f);
  const cx = f.x;
  const cy = f.y;

  switch (f.kind) {
    case 'sofa': {
      const backH = b.h * 0.22;
      return (
        <g transform={tf}>
          <rect
            x={b.x}
            y={b.y}
            width={b.w}
            height={b.h}
            rx={4}
            fill={fill}
            stroke={stroke}
            strokeWidth={1.5}
          />
          <rect
            x={b.x}
            y={b.y}
            width={b.w}
            height={backH}
            rx={3}
            fill="rgba(55,65,81,0.12)"
            stroke={stroke}
            strokeWidth={1}
          />
          {f.sofaStyle === 'corner' && (
            <rect
              x={b.x + b.w * 0.65}
              y={b.y + backH}
              width={b.w * 0.35}
              height={b.h * 0.55}
              rx={3}
              fill={fill}
              stroke={stroke}
              strokeWidth={1}
            />
          )}
        </g>
      );
    }
    case 'toilet':
      return (
        <g transform={tf}>
          <rect
            x={b.x + b.w * 0.15}
            y={b.y}
            width={b.w * 0.7}
            height={b.h * 0.55}
            rx={b.w * 0.2}
            fill={fill}
            stroke={stroke}
            strokeWidth={1.5}
          />
          <rect
            x={b.x + b.w * 0.2}
            y={b.y + b.h * 0.5}
            width={b.w * 0.6}
            height={b.h * 0.45}
            rx={3}
            fill={fill}
            stroke={stroke}
            strokeWidth={1.2}
          />
        </g>
      );
    case 'sink':
      return (
        <g transform={tf}>
          <rect
            x={b.x}
            y={b.y + b.h * 0.35}
            width={b.w}
            height={b.h * 0.35}
            rx={3}
            fill={fill}
            stroke={stroke}
            strokeWidth={1.5}
          />
          <ellipse
            cx={cx}
            cy={b.y + b.h * 0.52}
            rx={b.w * 0.22}
            ry={b.h * 0.18}
            fill="#e5e7eb"
            stroke={stroke}
            strokeWidth={1}
          />
        </g>
      );
    case 'cabinet':
      return (
        <g transform={tf}>
          <rect
            x={b.x}
            y={b.y}
            width={b.w}
            height={b.h}
            fill={fill}
            stroke={stroke}
            strokeWidth={1.5}
          />
          <line
            x1={b.x + b.w * 0.5}
            y1={b.y}
            x2={b.x + b.w * 0.5}
            y2={b.y + b.h}
            stroke={stroke}
            strokeWidth={0.8}
            opacity={0.5}
          />
        </g>
      );
    case 'tv_wall':
      return (
        <g transform={tf}>
          <rect
            x={b.x}
            y={b.y}
            width={b.w}
            height={b.h}
            fill="#1f2937"
            stroke={stroke}
            strokeWidth={1.2}
          />
          <rect
            x={b.x + b.w * 0.08}
            y={b.y + b.h * 0.15}
            width={b.w * 0.84}
            height={b.h * 0.7}
            fill="#374151"
            stroke="none"
          />
        </g>
      );
    case 'tv_stand':
      return (
        <g transform={tf}>
          <rect
            x={b.x}
            y={b.y}
            width={b.w}
            height={b.h * 0.34}
            fill="#1f2937"
            stroke={stroke}
            strokeWidth={1.2}
          />
          <rect
            x={b.x + b.w * 0.08}
            y={b.y + b.h * 0.06}
            width={b.w * 0.84}
            height={b.h * 0.22}
            fill="#374151"
            stroke="none"
          />
          <rect
            x={b.x + b.w * 0.32}
            y={b.y + b.h * 0.34}
            width={b.w * 0.36}
            height={b.h * 0.58}
            rx={2}
            fill={fill}
            stroke={stroke}
            strokeWidth={1.2}
          />
        </g>
      );
    case 'whiteboard':
      return (
        <g transform={tf}>
          <rect
            x={b.x}
            y={b.y}
            width={b.w}
            height={b.h * 0.75}
            fill="#f8fafc"
            stroke={stroke}
            strokeWidth={1.5}
          />
          <line
            x1={b.x}
            y1={b.y + b.h * 0.75}
            x2={b.x + b.w}
            y2={b.y + b.h * 0.75}
            stroke={stroke}
            strokeWidth={2}
          />
          <rect
            x={b.x + b.w * 0.4}
            y={b.y + b.h * 0.75}
            width={b.w * 0.2}
            height={b.h * 0.25}
            fill={fill}
            stroke={stroke}
            strokeWidth={1}
          />
        </g>
      );
    default:
      return <rect x={b.x} y={b.y} width={b.w} height={b.h} fill={fill} stroke={stroke} />;
  }
}
