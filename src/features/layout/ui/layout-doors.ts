/** Wall-snapped doors for layout editor */

import type { DoorKind, DoorSwing } from './layout-editor-catalog';
import { newLayoutId } from './layout-id';
import type { Point } from './layout-pick';
import type { WallSegment } from './layout-windows';
import { proposeWindowPlacement, wallNormal, wallUnit, type WindowSpan } from './layout-windows';

export type PlanDoor = {
  id: string;
  name: string;
  widthM: number;
  spans: WindowSpan[];
  kind: DoorKind;
  swing: DoorSwing;
  hingeSide: 'left' | 'right';
  presetId?: string;
};

export type DoorDrawPart = {
  wallId: string;
  a: Point;
  b: Point;
  n: Point;
  halfThick: number;
  kind: DoorKind;
  swing: DoorSwing;
  hingeSide: 'left' | 'right';
};

export function proposeDoorPlacement(
  walls: WallSegment[],
  p: Point,
  widthM: number,
  pxPerMeter: number,
) {
  return proposeWindowPlacement(walls, p, widthM, pxPerMeter);
}

export function doorDrawParts(
  door: PlanDoor,
  walls: WallSegment[],
  wallThicknessPx: number,
): DoorDrawPart[] {
  const parts: DoorDrawPart[] = [];
  const halfThick = wallThicknessPx / 2;
  for (const span of door.spans) {
    const w = walls.find((x) => x.id === span.wallId);
    if (!w) continue;
    const u = wallUnit(w);
    const n = wallNormal(w);
    const a = { x: w.start.x + u.x * span.fromPx, y: w.start.y + u.y * span.fromPx };
    const b = { x: w.start.x + u.x * span.toPx, y: w.start.y + u.y * span.toPx };
    parts.push({
      wallId: span.wallId,
      a,
      b,
      n,
      halfThick,
      kind: door.kind,
      swing: door.swing,
      hingeSide: door.hingeSide,
    });
  }
  return parts;
}

export function doorWallCutPath(part: DoorDrawPart, bleed = 0.35): string {
  const { a, b, n, halfThick } = part;
  const half = halfThick + bleed;
  const oa = { x: a.x + n.x * half, y: a.y + n.y * half };
  const ob = { x: b.x + n.x * half, y: b.y + n.y * half };
  const ia = { x: a.x - n.x * half, y: a.y - n.y * half };
  const ib = { x: b.x - n.x * half, y: b.y - n.y * half };
  return `M ${oa.x} ${oa.y} L ${ob.x} ${ob.y} L ${ib.x} ${ib.y} L ${ia.x} ${ia.y} Z`;
}

/** Architectural door: gap + leaf line + swing arc */
export function doorSymbolPath(part: DoorDrawPart): string {
  const { a, b, n, kind, swing, hingeSide } = part;
  const ux = b.x - a.x;
  const uy = b.y - a.y;
  const len = Math.hypot(ux, uy) || 1;
  const tx = ux / len;
  const ty = uy / len;
  const hinge = hingeSide === 'left' ? a : b;
  const openDir = swing === 'in' ? -1 : swing === 'out' ? 1 : 1;
  const leafLen = len * 0.92;
  const lx = hinge.x + tx * leafLen * (hingeSide === 'left' ? 1 : -1);
  const ly = hinge.y + ty * leafLen * (hingeSide === 'left' ? 1 : -1);
  const leafEnd = {
    x: lx + n.x * leafLen * openDir,
    y: ly + n.y * leafLen * openDir,
  };
  const r = leafLen;
  const sweep = openDir > 0 ? 1 : 0;
  const arc = `M ${lx} ${ly} A ${r} ${r} 0 0 ${sweep} ${leafEnd.x} ${leafEnd.y}`;
  const leaf = `M ${hinge.x} ${hinge.y} L ${leafEnd.x} ${leafEnd.y}`;
  const lock =
    kind === 'code_lock' ? `<circle cx="${(a.x + b.x) / 2}" cy="${(a.y + b.y) / 2}" r="2" />` : '';
  void lock;
  return `${leaf} ${arc}`;
}

export function doorSymbolElements(part: DoorDrawPart) {
  const { a, b, n, kind, swing, hingeSide } = part;
  const ux = b.x - a.x;
  const uy = b.y - a.y;
  const len = Math.hypot(ux, uy) || 1;
  const tx = ux / len;
  const ty = uy / len;
  const hinge = hingeSide === 'left' ? a : b;
  const openDir = swing === 'in' ? -1 : 1;
  const leafLen = len * 0.92;
  const sign = hingeSide === 'left' ? 1 : -1;
  const lx = hinge.x + tx * leafLen * sign;
  const ly = hinge.y + ty * leafLen * sign;
  const leafEnd = {
    x: lx + n.x * leafLen * openDir,
    y: ly + n.y * leafLen * openDir,
  };
  const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
  return { hinge, leafEnd, mid, kind, swing };
}

export function extractDoors(elements: Array<unknown>): PlanDoor[] {
  return (elements || [])
    .filter((el) => (el as { elementType?: string })?.elementType === 'DOOR')
    .map((el) => {
      const e = el as Record<string, unknown>;
      const g = (e.geometry || {}) as Record<string, unknown>;
      const spans = Array.isArray(g.spans) ? (g.spans as WindowSpan[]) : [];
      if (!spans.length) return null;
      const widthM = Number(g.widthM ?? (e.props as Record<string, unknown>)?.widthM) || 0.9;
      const p = (e.props || {}) as Record<string, unknown>;
      return {
        id: String(e.id || newLayoutId()),
        name: String(e.name || 'Дверь'),
        widthM,
        spans,
        kind: p.kind === 'code_lock' ? 'code_lock' : 'plain',
        swing: p.swing === 'in' || p.swing === 'both' ? p.swing : 'out',
        hingeSide: p.hingeSide === 'right' ? 'right' : 'left',
        presetId: typeof p.presetId === 'string' ? p.presetId : undefined,
      } satisfies PlanDoor;
    })
    .filter(Boolean) as PlanDoor[];
}

export function doorToElement(d: PlanDoor) {
  return {
    id: d.id,
    elementType: 'DOOR',
    name: d.name,
    geometry: { widthM: d.widthM, spans: d.spans },
    props: {
      kind: d.kind,
      swing: d.swing,
      hingeSide: d.hingeSide,
      presetId: d.presetId,
    },
  };
}

export function cloneDoors(list: PlanDoor[]) {
  return list.map((d) => ({ ...d, spans: d.spans.map((s) => ({ ...s })) }));
}

function distPointToSegmentSquared(p: Point, a: Point, b: Point): number {
  const abx = b.x - a.x;
  const aby = b.y - a.y;
  const apx = p.x - a.x;
  const apy = p.y - a.y;
  const ab2 = abx * abx + aby * aby;
  if (ab2 < 1e-9) return apx * apx + apy * apy;
  let t = (apx * abx + apy * aby) / ab2;
  t = Math.max(0, Math.min(1, t));
  const cx = a.x + t * abx;
  const cy = a.y + t * aby;
  const dx = p.x - cx;
  const dy = p.y - cy;
  return dx * dx + dy * dy;
}

export function hitTestDoor(
  doors: PlanDoor[],
  walls: WallSegment[],
  p: Point,
  hitDist = 14,
): PlanDoor | null {
  const lim = hitDist * hitDist;
  for (let i = doors.length - 1; i >= 0; i--) {
    const door = doors[i];
    for (const span of door.spans) {
      const w = walls.find((x) => x.id === span.wallId);
      if (!w) continue;
      const u = wallUnit(w);
      const a = { x: w.start.x + u.x * span.fromPx, y: w.start.y + u.y * span.fromPx };
      const b = { x: w.start.x + u.x * span.toPx, y: w.start.y + u.y * span.toPx };
      if (distPointToSegmentSquared(p, a, b) <= lim) return door;
    }
  }
  return null;
}

export function doorIntersectsNormRect(
  door: PlanDoor,
  walls: WallSegment[],
  r: { x: number; y: number; w: number; h: number },
): boolean {
  for (const part of doorDrawParts(door, walls, 12)) {
    for (const p of [part.a, part.b]) {
      if (p.x >= r.x && p.x <= r.x + r.w && p.y >= r.y && p.y <= r.y + r.h) return true;
    }
    if (distPointToSegmentSquared({ x: r.x, y: r.y }, part.a, part.b) <= 0) return true;
  }
  return false;
}
