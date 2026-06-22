/** Wall-snapped windows for cafe layout editor */

import { newLayoutId } from './layout-id';

export type Point = { x: number; y: number };

export type WallSegment = { id: string; start: Point; end: Point };

/** Segment along a wall from start (px) to end (px) */
export type WindowSpan = {
  wallId: string;
  fromPx: number;
  toPx: number;
};

export type PlanWindow = {
  id: string;
  name: string;
  widthM: number;
  spans: WindowSpan[];
  presetId?: string;
};

export type WindowPreset = {
  id: string;
  name: string;
  widthM: number;
};

export type WindowDefaults = { name: string; widthM: number };

const DEFAULT_WINDOW: WindowDefaults = { name: 'Окно', widthM: 1.2 };

export const WALL_SNAP_DIST = 20;
export const WALL_DETACH_DIST = 32;
export const WALL_VIS_THICKNESS = 6;
export const CORNER_WELD_EPS = 4;

export function metersToPx(m: number, pxPerMeter: number) {
  return m * pxPerMeter;
}

function dist(a: Point, b: Point) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function eqPoint(a: Point, b: Point, eps = CORNER_WELD_EPS) {
  return dist(a, b) <= eps;
}

export function wallLength(w: WallSegment) {
  return dist(w.start, w.end);
}

export function wallUnit(w: WallSegment): Point {
  const len = wallLength(w);
  if (len < 1e-6) return { x: 1, y: 0 };
  return { x: (w.end.x - w.start.x) / len, y: (w.end.y - w.start.y) / len };
}

export function wallNormal(w: WallSegment): Point {
  const u = wallUnit(w);
  return { x: -u.y, y: u.x };
}

function projectOnWall(w: WallSegment, p: Point): { along: number; dist: number; point: Point } {
  const ux = w.end.x - w.start.x;
  const uy = w.end.y - w.start.y;
  const len2 = ux * ux + uy * uy;
  if (len2 < 1e-9) {
    const d = dist(w.start, p);
    return { along: 0, dist: d, point: { ...w.start } };
  }
  let t = ((p.x - w.start.x) * ux + (p.y - w.start.y) * uy) / len2;
  t = Math.max(0, Math.min(1, t));
  const point = { x: w.start.x + t * ux, y: w.start.y + t * uy };
  return { along: t * Math.sqrt(len2), dist: dist(point, p), point };
}

export function findWall(walls: WallSegment[], id: string) {
  return walls.find((w) => w.id === id) ?? null;
}

/** Walls sharing endpoint with exactly 2 segments at a vertex (corner). */
export function cornerWallsAt(
  walls: WallSegment[],
  vertex: Point,
): [WallSegment, WallSegment] | null {
  const at: WallSegment[] = [];
  for (const w of walls) {
    if (eqPoint(w.start, vertex) || eqPoint(w.end, vertex)) at.push(w);
  }
  if (at.length !== 2) return null;
  return [at[0], at[1]];
}

function nearestWallProjection(
  walls: WallSegment[],
  p: Point,
  maxDist = WALL_SNAP_DIST,
): { wall: WallSegment; along: number; dist: number; point: Point } | null {
  let best: { wall: WallSegment; along: number; dist: number; point: Point } | null = null;
  for (const w of walls) {
    const pr = projectOnWall(w, p);
    if (pr.dist <= maxDist && (!best || pr.dist < best.dist)) {
      best = { wall: w, along: pr.along, dist: pr.dist, point: pr.point };
    }
  }
  return best;
}

function spanFromCenter(
  wall: WallSegment,
  centerAlong: number,
  widthPx: number,
): WindowSpan | null {
  const len = wallLength(wall);
  if (len < 4) return null;
  const half = widthPx / 2;
  let fromPx = centerAlong - half;
  let toPx = centerAlong + half;
  if (toPx - fromPx < 8) return null;
  if (fromPx < 0) {
    toPx -= fromPx;
    fromPx = 0;
  }
  if (toPx > len) {
    fromPx -= toPx - len;
    toPx = len;
  }
  fromPx = Math.max(0, fromPx);
  toPx = Math.min(len, toPx);
  if (toPx - fromPx < 8) return null;
  return { wallId: wall.id, fromPx, toPx };
}

/** Try corner window spanning two walls meeting at vertex near placement. */
function tryCornerSpans(
  walls: WallSegment[],
  primary: WallSegment,
  centerAlong: number,
  widthPx: number,
): WindowSpan[] | null {
  const len = wallLength(primary);
  const half = widthPx / 2;
  const u = wallUnit(primary);

  const tryAt = (vertex: Point, onEnd: boolean): WindowSpan[] | null => {
    const pair = cornerWallsAt(walls, vertex);
    if (!pair) return null;
    const other = pair[0].id === primary.id ? pair[1] : pair[0];
    const distToCorner = onEnd ? len - centerAlong : centerAlong;
    if (distToCorner > half + CORNER_WELD_EPS * 2) return null;

    const len1 = wallLength(primary);
    const len2 = wallLength(other);
    if (len1 < 4 || len2 < 4) return null;

    let w1 = Math.min(half + distToCorner, len1);
    let w2 = widthPx - w1;
    if (w2 < 8) w2 = 8;
    if (w1 < 8) w1 = 8;
    if (w1 + w2 > widthPx + 1) {
      const scale = widthPx / (w1 + w2);
      w1 *= scale;
      w2 *= scale;
    }

    if (onEnd) {
      return [
        { wallId: primary.id, fromPx: Math.max(0, len1 - w1), toPx: len1 },
        { wallId: other.id, fromPx: 0, toPx: Math.min(len2, w2) },
      ];
    }
    return [
      { wallId: primary.id, fromPx: 0, toPx: Math.min(len1, w1) },
      {
        wallId: other.id,
        fromPx: Math.max(0, len2 - w2),
        toPx: len2,
      },
    ];
  };

  if (centerAlong >= len - half - CORNER_WELD_EPS) {
    return tryAt(primary.end, true);
  }
  if (centerAlong <= half + CORNER_WELD_EPS) {
    return tryAt(primary.start, false);
  }
  return null;
}

export function proposeWindowPlacement(
  walls: WallSegment[],
  point: Point,
  widthM: number,
  pxPerMeter: number,
  preferCorner = true,
): { spans: WindowSpan[]; widthM: number } | null {
  if (!walls.length) return null;
  const widthPx = metersToPx(widthM, pxPerMeter);
  const hit = nearestWallProjection(walls, point, WALL_SNAP_DIST);
  if (!hit) return null;

  if (preferCorner) {
    const corner = tryCornerSpans(walls, hit.wall, hit.along, widthPx);
    if (corner) return { spans: corner, widthM };
  }

  const span = spanFromCenter(hit.wall, hit.along, widthPx);
  if (!span) return null;
  return { spans: [span], widthM };
}

export function clampWindowSpans(w: PlanWindow, walls: WallSegment[]): PlanWindow {
  const spans: WindowSpan[] = [];
  for (const s of w.spans) {
    const wall = findWall(walls, s.wallId);
    if (!wall) continue;
    const len = wallLength(wall);
    let fromPx = Math.max(0, Math.min(s.fromPx, len));
    let toPx = Math.max(0, Math.min(s.toPx, len));
    if (toPx < fromPx) [fromPx, toPx] = [toPx, fromPx];
    if (toPx - fromPx < 8) continue;
    spans.push({ wallId: s.wallId, fromPx, toPx });
  }
  if (!spans.length) return w;
  return { ...w, spans };
}

export function sanitizeWindows(windows: PlanWindow[], walls: WallSegment[]): PlanWindow[] {
  const wallMap = new Map(walls.map((w) => [w.id, w]));
  const out: PlanWindow[] = [];
  for (const win of windows) {
    const valid = win.spans.filter((s) => wallMap.has(s.wallId));
    if (!valid.length) continue;
    if (valid.length === 2) {
      const w1 = wallMap.get(valid[0].wallId)!;
      const w2 = wallMap.get(valid[1].wallId)!;
      const verts = [w1.start, w1.end, w2.start, w2.end];
      let shared: Point | null = null;
      for (let i = 0; i < verts.length; i++) {
        for (let j = i + 1; j < verts.length; j++) {
          if (eqPoint(verts[i], verts[j])) shared = verts[i];
        }
      }
      if (!shared || cornerWallsAt(walls, shared) === null) {
        out.push(clampWindowSpans({ ...win, spans: [valid[0]] }, walls));
        continue;
      }
    }
    out.push(clampWindowSpans({ ...win, spans: valid }, walls));
  }
  return out;
}

export function removeWindowsOnWalls(windows: PlanWindow[], wallIds: Set<string>): PlanWindow[] {
  return windows.filter((win) => !win.spans.some((s) => wallIds.has(s.wallId)));
}

export function moveWindowToPointPx(
  walls: WallSegment[],
  win: PlanWindow,
  mouse: Point,
  pxPerMeter: number,
): PlanWindow {
  const widthPx = metersToPx(win.widthM, pxPerMeter);
  const hit = nearestWallProjection(walls, mouse, WALL_DETACH_DIST);
  if (!hit) {
    const far = nearestWallProjection(walls, mouse, 1e9);
    if (!far) return win;
    const corner = tryCornerSpans(walls, far.wall, far.along, widthPx);
    if (corner) return { ...win, spans: corner };
    const span = spanFromCenter(far.wall, far.along, widthPx);
    return span ? { ...win, spans: [span] } : win;
  }
  const corner = tryCornerSpans(walls, hit.wall, hit.along, widthPx);
  if (corner) return { ...win, spans: corner };
  const span = spanFromCenter(hit.wall, hit.along, widthPx);
  return span ? { ...win, spans: [span] } : win;
}

export function slideWindowAlongWall(
  walls: WallSegment[],
  win: PlanWindow,
  mouse: Point,
  pxPerMeter: number,
): PlanWindow {
  const primaryId = win.spans[0]?.wallId;
  const wall = primaryId ? findWall(walls, primaryId) : null;
  if (!wall) return moveWindowToPointPx(walls, win, mouse, pxPerMeter);

  const pr = projectOnWall(wall, mouse);
  if (pr.dist > WALL_DETACH_DIST) {
    return moveWindowToPointPx(walls, win, mouse, pxPerMeter);
  }

  const widthPx = metersToPx(win.widthM, pxPerMeter);
  if (win.spans.length === 2) {
    const corner = tryCornerSpans(walls, wall, pr.along, widthPx);
    if (corner) return { ...win, spans: corner };
  }
  const span = spanFromCenter(wall, pr.along, widthPx);
  return span ? { ...win, spans: [span] } : win;
}

export type WindowDrawPart = {
  wallId: string;
  /** centerline from */
  a: Point;
  b: Point;
  /** unit normal (left of wall direction) */
  n: Point;
  capR: number;
  /** half of visual wall thickness in px */
  halfThick: number;
};

export function windowDrawParts(
  win: PlanWindow,
  walls: WallSegment[],
  wallThicknessPx: number = WALL_VIS_THICKNESS,
): WindowDrawPart[] {
  const parts: WindowDrawPart[] = [];
  for (const span of win.spans) {
    const w = findWall(walls, span.wallId);
    if (!w) continue;
    const u = wallUnit(w);
    const n = wallNormal(w);
    const a = {
      x: w.start.x + u.x * span.fromPx,
      y: w.start.y + u.y * span.fromPx,
    };
    const b = {
      x: w.start.x + u.x * span.toPx,
      y: w.start.y + u.y * span.toPx,
    };
    const segLen = dist(a, b);
    const halfThick = wallThicknessPx / 2;
    parts.push({
      wallId: span.wallId,
      a,
      b,
      n,
      capR: Math.min(segLen / 2, halfThick * 1.05),
      halfThick,
    });
  }
  return parts;
}

/** Full-thickness cut through wall (for punching hatch). */
export function windowWallCutPath(part: WindowDrawPart, bleed = 0.35): string {
  const { a, b, n, halfThick } = part;
  const half = halfThick + bleed;
  const oa = { x: a.x + n.x * half, y: a.y + n.y * half };
  const ob = { x: b.x + n.x * half, y: b.y + n.y * half };
  const ia = { x: a.x - n.x * half, y: a.y - n.y * half };
  const ib = { x: b.x - n.x * half, y: b.y - n.y * half };
  return `M ${oa.x} ${oa.y} L ${ob.x} ${ob.y} L ${ib.x} ${ib.y} L ${ia.x} ${ia.y} Z`;
}

/** SVG path: recessed opening with semicircular end caps (architectural plan style). */
export function windowOpeningPath(part: WindowDrawPart, inset = 0.15): string {
  const { a, b, n, capR } = part;
  const half = part.halfThick - inset;
  const oa = { x: a.x + n.x * half, y: a.y + n.y * half };
  const ob = { x: b.x + n.x * half, y: b.y + n.y * half };
  const ia = { x: a.x - n.x * half, y: a.y - n.y * half };
  const ib = { x: b.x - n.x * half, y: b.y - n.y * half };
  const ux = b.x - a.x;
  const uy = b.y - a.y;
  const len = Math.hypot(ux, uy) || 1;
  const tx = ux / len;
  const ty = uy / len;
  const r = Math.min(capR, len / 2 - 0.5);
  if (r < 1) {
    return `M ${oa.x} ${oa.y} L ${ob.x} ${ob.y} L ${ib.x} ${ib.y} L ${ia.x} ${ia.y} Z`;
  }
  const la = { x: oa.x - tx * r, y: oa.y - ty * r };
  const lb = { x: ob.x + tx * r, y: ob.y + ty * r };
  const lia = { x: ia.x - tx * r, y: ia.y - ty * r };
  const lib = { x: ib.x + tx * r, y: ib.y + ty * r };
  return [
    `M ${la.x} ${la.y}`,
    `L ${lb.x} ${lb.y}`,
    `A ${r} ${r} 0 0 1 ${ob.x} ${ob.y}`,
    `L ${ib.x} ${ib.y}`,
    `A ${r} ${r} 0 0 1 ${lib.x} ${lib.y}`,
    `L ${lia.x} ${lia.y}`,
    `A ${r} ${r} 0 0 1 ${ia.x} ${ia.y}`,
    'Z',
  ].join(' ');
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

export function hitTestWindow(
  windows: PlanWindow[],
  walls: WallSegment[],
  p: Point,
  hitDist = 12,
): PlanWindow | null {
  const lim = hitDist * hitDist;
  for (let i = windows.length - 1; i >= 0; i--) {
    const win = windows[i];
    for (const span of win.spans) {
      const w = findWall(walls, span.wallId);
      if (!w) continue;
      const u = wallUnit(w);
      const a = { x: w.start.x + u.x * span.fromPx, y: w.start.y + u.y * span.fromPx };
      const b = { x: w.start.x + u.x * span.toPx, y: w.start.y + u.y * span.toPx };
      if (distPointToSegmentSquared(p, a, b) <= lim) return win;
    }
  }
  return null;
}

export function windowIntersectsNormRect(
  win: PlanWindow,
  walls: WallSegment[],
  r: { x: number; y: number; w: number; h: number },
): boolean {
  for (const part of windowDrawParts(win, walls)) {
    const pts = [part.a, part.b];
    for (const p of pts) {
      if (p.x >= r.x && p.x <= r.x + r.w && p.y >= r.y && p.y <= r.y + r.h) return true;
    }
    const cx = (r.x + r.x + r.w) / 2;
    const cy = (r.y + r.y + r.h) / 2;
    void cx;
    void cy;
    if (distPointToSegmentSquared({ x: r.x, y: r.y }, part.a, part.b) <= 0) return true;
  }
  const rx2 = r.x + r.w;
  const ry2 = r.y + r.h;
  const corners: Point[] = [
    { x: r.x, y: r.y },
    { x: rx2, y: r.y },
    { x: rx2, y: ry2 },
    { x: r.x, y: ry2 },
  ];
  for (const part of windowDrawParts(win, walls)) {
    for (const c of corners) {
      if (distPointToSegmentSquared(c, part.a, part.b) <= 144) return true;
    }
  }
  return false;
}

export function visitWindowPoints(
  windows: PlanWindow[],
  walls: WallSegment[],
  visit: (p: Point) => void,
) {
  for (const win of windows) {
    for (const part of windowDrawParts(win, walls)) {
      visit(part.a);
      visit(part.b);
    }
  }
}

export function cloneWindows(list: PlanWindow[]): PlanWindow[] {
  return list.map((w) => ({
    ...w,
    spans: w.spans.map((s) => ({ ...s })),
  }));
}

export function extractWindows(elements: Array<unknown>): PlanWindow[] {
  return (elements || [])
    .filter((el) => (el as { elementType?: string })?.elementType === 'WINDOW')
    .map((el) => {
      const e = el as Record<string, unknown>;
      const g = (e.geometry || {}) as Record<string, unknown>;
      const props = (e.props || {}) as Record<string, unknown>;
      const widthM = Number(g.widthM ?? props.widthM);
      if (!Number.isFinite(widthM)) return null;
      const spansRaw = g.spans ?? props.spans;
      let spans: WindowSpan[] = [];
      if (Array.isArray(spansRaw)) {
        spans = spansRaw
          .map((s: unknown) => {
            const o = s as Record<string, unknown>;
            const wallId = String(o.wallId || '');
            const fromPx = Number(o.fromPx);
            const toPx = Number(o.toPx);
            if (!wallId || !Number.isFinite(fromPx) || !Number.isFinite(toPx)) return null;
            return { wallId, fromPx, toPx };
          })
          .filter(Boolean) as WindowSpan[];
      }
      if (!spans.length && typeof g.wallId === 'string') {
        const alongPx = Number(g.alongPx);
        const fromPx = Number(g.fromPx);
        const toPx = Number(g.toPx);
        if (Number.isFinite(fromPx) && Number.isFinite(toPx)) {
          spans = [{ wallId: g.wallId, fromPx, toPx }];
        } else if (Number.isFinite(alongPx)) {
          const half = (widthM * 20) / 2;
          spans = [{ wallId: g.wallId, fromPx: alongPx - half, toPx: alongPx + half }];
        }
      }
      if (!spans.length) return null;
      return {
        id: String(e.id || newLayoutId()),
        name: String(e.name || 'Окно'),
        widthM,
        spans,
        presetId: typeof props.presetId === 'string' ? props.presetId : undefined,
      } satisfies PlanWindow;
    })
    .filter(Boolean) as PlanWindow[];
}

export function windowToElement(win: PlanWindow) {
  return {
    id: win.id,
    elementType: 'WINDOW',
    name: win.name,
    geometry: {
      widthM: Math.round(win.widthM * 100) / 100,
      spans: win.spans.map((s) => ({
        wallId: s.wallId,
        fromPx: Math.round(s.fromPx * 100) / 100,
        toPx: Math.round(s.toPx * 100) / 100,
      })),
    },
    props: { presetId: win.presetId, widthM: win.widthM, spans: win.spans },
  };
}

export function readWindowDefaults(schema: unknown): WindowDefaults {
  const root =
    schema && typeof schema === 'object' && schema !== null
      ? (schema as Record<string, unknown>)
      : null;
  const d = root?.lastWindowDefaults;
  if (d && typeof d === 'object' && d !== null) {
    const o = d as Record<string, unknown>;
    return {
      name: String(o.name || DEFAULT_WINDOW.name),
      widthM: Math.min(8, Math.max(0.3, Number(o.widthM) || DEFAULT_WINDOW.widthM)),
    };
  }
  return { ...DEFAULT_WINDOW };
}

export function readWindowPresets(schema: unknown, windows: PlanWindow[]): WindowPreset[] {
  const root =
    schema && typeof schema === 'object' && schema !== null
      ? (schema as Record<string, unknown>)
      : null;
  const raw = root?.editorWindowPresets;
  const byKey = new Map<string, WindowPreset>();
  if (Array.isArray(raw)) {
    for (const p of raw) {
      const o = p as Record<string, unknown>;
      const id = typeof o?.id === 'string' ? o.id : '';
      const name = typeof o?.name === 'string' ? o.name : '';
      const widthM = Number(o?.widthM);
      if (id && name && Number.isFinite(widthM)) byKey.set(id, { id, name, widthM });
    }
  }
  for (const w of windows) {
    const key = w.presetId || `${w.name}|${w.widthM}`;
    if (!byKey.has(key)) byKey.set(key, { id: w.presetId || key, name: w.name, widthM: w.widthM });
  }
  return [...byKey.values()];
}
