import type { ReactNode } from 'react';
import type { StairKind } from './layout-editor-catalog';
import { furnitureBoundsPx, furnitureTransform } from './layout-furniture';
import type { PlanStair } from './layout-stairs';

type Bounds = { x: number; y: number; w: number; h: number };

function stepsUp(
  x0: number,
  y0: number,
  w: number,
  h: number,
  count: number,
  vertical: boolean,
): string[] {
  const lines: string[] = [];
  const n = Math.max(4, count);
  for (let i = 1; i <= n; i++) {
    const t = i / n;
    if (vertical) {
      const y = y0 + h * (1 - t);
      lines.push(`M ${x0} ${y} L ${x0 + w * t} ${y}`);
    } else {
      const x = x0 + w * t;
      lines.push(`M ${x} ${y0 + h} L ${x} ${y0 + h * (1 - t)}`);
    }
  }
  return lines;
}

function stepsDown(
  x0: number,
  y0: number,
  w: number,
  h: number,
  count: number,
  vertical: boolean,
): string[] {
  const lines: string[] = [];
  const n = Math.max(4, count);
  for (let i = 1; i <= n; i++) {
    const t = i / n;
    if (vertical) {
      const y = y0 + h * t;
      lines.push(`M ${x0 + w} ${y} L ${x0 + w * (1 - t)} ${y}`);
    } else {
      const x = x0 + w * (1 - t);
      lines.push(`M ${x} ${y0} L ${x} ${y0 + h * t}`);
    }
  }
  return lines;
}

function roundSteps(cx: number, cy: number, rx: number, ry: number): string[] {
  const paths: string[] = [];
  const n = 8;
  for (let i = 0; i < n; i++) {
    const a0 = (i / n) * Math.PI * 1.5 - Math.PI * 0.25;
    const a1 = ((i + 0.85) / n) * Math.PI * 1.5 - Math.PI * 0.25;
    const x0 = cx + Math.cos(a0) * rx * 0.35;
    const y0 = cy + Math.sin(a0) * ry * 0.35;
    const x1 = cx + Math.cos(a1) * rx;
    const y1 = cy + Math.sin(a1) * ry;
    paths.push(`M ${x0} ${y0} L ${x1} ${y1}`);
  }
  for (let i = 0; i < n; i++) {
    const t = (i + 1) / n;
    const a = t * Math.PI * 1.5 - Math.PI * 0.25;
    const rxi = rx * (0.4 + t * 0.55);
    const ryi = ry * (0.4 + t * 0.55);
    paths.push(
      `M ${cx + Math.cos(a) * rxi * 0.9} ${cy + Math.sin(a) * ryi * 0.9} A ${rxi} ${ryi} 0 0 1 ${cx + Math.cos(a + 0.15) * rxi} ${cy + Math.sin(a + 0.15) * ryi}`,
    );
  }
  return paths;
}

function renderHalfRoomSegment(
  b: Bounds,
  stroke: string,
  fill: string,
  role: 'up' | 'down' | undefined,
) {
  const stepCount = Math.max(4, Math.floor(b.h / 14));
  const lines =
    role === 'down'
      ? stepsDown(b.x + 2, b.y + 2, b.w - 4, b.h - 4, stepCount, true)
      : stepsUp(b.x + 2, b.y + 2, b.w - 4, b.h - 4, stepCount, true);

  return (
    <g>
      <rect
        x={b.x}
        y={b.y}
        width={b.w}
        height={b.h}
        fill={fill}
        stroke={stroke}
        strokeWidth={1.5}
      />
      {lines.map((d, i) => (
        <path key={i} d={d} fill="none" stroke={stroke} strokeWidth={1} opacity={0.85} />
      ))}
    </g>
  );
}

function halfRoomLink(st: PlanStair, partner: PlanStair) {
  return (
    <line
      x1={st.x}
      y1={st.y}
      x2={partner.x}
      y2={partner.y}
      stroke="#6b7280"
      strokeWidth={1.2}
      strokeDasharray="6 4"
      pointerEvents="none"
    />
  );
}

export function StairShape({
  st,
  pxPerMeter,
  active,
  delFlash,
  conflict,
  partner,
}: {
  st: PlanStair;
  pxPerMeter: number;
  active?: boolean;
  delFlash?: boolean;
  conflict?: boolean;
  partner?: PlanStair;
}) {
  const b = furnitureBoundsPx(st, pxPerMeter);
  const highlight = delFlash || conflict;
  const stroke = highlight ? '#dc2626' : active ? '#ea580c' : '#374151';
  const fill = highlight
    ? 'rgba(220,38,38,0.25)'
    : active
      ? 'rgba(234,88,12,0.12)'
      : 'rgba(249,250,251,0.95)';
  const stepCount = Math.max(4, Math.floor(Math.min(b.w, b.h) / 12));

  const tf = furnitureTransform(st);
  const wrap = (body: ReactNode) => (tf ? <g transform={tf}>{body}</g> : <>{body}</>);

  if (st.kind === 'half_room') {
    const body = renderHalfRoomSegment(b, stroke, fill, st.pairRole);
    const link =
      partner && (st.pairRole === 'up' || !st.pairRole) ? halfRoomLink(st, partner) : null;
    return (
      <>
        {wrap(body)}
        {link}
      </>
    );
  }

  if (st.kind === 'round') {
    const cx = st.x;
    const cy = st.y;
    const rx = b.w / 2;
    const ry = b.h / 2;
    const paths = roundSteps(cx, cy, rx, ry);
    return wrap(
      <g>
        <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill={fill} stroke={stroke} strokeWidth={1.5} />
        {paths.map((d, i) => (
          <path key={i} d={d} fill="none" stroke={stroke} strokeWidth={1} opacity={0.9} />
        ))}
      </g>,
    );
  }

  const midX = b.x + b.w / 2;
  const left = { x: b.x, y: b.y, w: b.w / 2 - 1, h: b.h };
  const right = { x: midX + 1, y: b.y, w: b.w / 2 - 1, h: b.h };
  const upLines = stepsUp(left.x + 2, left.y + 2, left.w - 4, left.h - 4, stepCount, true);
  const downLines = stepsDown(right.x + 2, right.y + 2, right.w - 4, right.h - 4, stepCount, true);

  return wrap(
    <g>
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
        x1={midX}
        y1={b.y}
        x2={midX}
        y2={b.y + b.h}
        stroke={stroke}
        strokeWidth={0.8}
        opacity={0.45}
      />
      {upLines.map((d, i) => (
        <path key={`u-${i}`} d={d} fill="none" stroke={stroke} strokeWidth={1} opacity={0.85} />
      ))}
      {downLines.map((d, i) => (
        <path key={`d-${i}`} d={d} fill="none" stroke={stroke} strokeWidth={1} opacity={0.85} />
      ))}
    </g>,
  );
}
