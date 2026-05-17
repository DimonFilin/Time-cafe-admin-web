/** Hit-test priority: smaller / more specific targets win (top of stack). */

import type { PlanDoor } from './layout-doors';
import { hitTestDoor } from './layout-doors';
import type { PlanFixture } from './layout-fixtures';
import { hitTestFixture } from './layout-fixtures';
import type { PlanChair, PlanTable } from './layout-furniture';
import { hitTestChair, hitTestTable } from './layout-furniture';
import type { PlanStair } from './layout-stairs';
import { hitTestStair } from './layout-stairs';
import type { PlanWindow } from './layout-windows';
import { hitTestWindow } from './layout-windows';

export type Point = { x: number; y: number };

export type WallSegment = { id: string; start: Point; end: Point };
export type RoomZone = { id: string; points: Point[]; roomId: string | null };

export type PickKind =
  | 'fixture'
  | 'chair'
  | 'table'
  | 'door'
  | 'stair'
  | 'window'
  | 'wall'
  | 'zone-vertex'
  | 'zone-body';

export type PickTarget = {
  kind: PickKind;
  id: string;
  /** Lower = picked first (on top) */
  priority: number;
  wallPart?: 'start' | 'end' | 'body';
  zoneVertexIndex?: number;
};

const PRIORITY: Record<PickKind, number> = {
  fixture: 8,
  chair: 10,
  table: 20,
  door: 25,
  stair: 28,
  window: 30,
  wall: 40,
  'zone-vertex': 50,
  'zone-body': 60,
};

const HIT_VERTEX = 14;
const HIT_WALL_BODY = 10;

function dist(a: Point, b: Point) {
  return Math.hypot(a.x - b.x, a.y - b.y);
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

function hitTestWallAt(
  walls: WallSegment[],
  p: Point,
): { id: string; part: 'start' | 'end' | 'body' } | null {
  let best: { id: string; part: 'start' | 'end' | 'body'; d2: number } | null = null;
  for (const wall of walls) {
    const ds = dist(wall.start, p);
    const de = dist(wall.end, p);
    if (ds <= HIT_VERTEX) {
      const d2 = ds * ds;
      if (!best || d2 < best.d2) best = { id: wall.id, part: 'start', d2 };
    }
    if (de <= HIT_VERTEX) {
      const d2 = de * de;
      if (!best || d2 < best.d2) best = { id: wall.id, part: 'end', d2 };
    }
    const d2 = distPointToSegmentSquared(p, wall.start, wall.end);
    const lim = HIT_WALL_BODY * HIT_WALL_BODY;
    if (d2 <= lim && (!best || d2 < best.d2)) {
      best = { id: wall.id, part: 'body', d2 };
    }
  }
  return best ? { id: best.id, part: best.part } : null;
}

function hitTestZoneAt(
  zones: RoomZone[],
  p: Point,
): { id: string; part: 'body' | 'vertex'; vertexIndex?: number } | null {
  for (let zi = zones.length - 1; zi >= 0; zi--) {
    const zone = zones[zi];
    for (let vi = 0; vi < zone.points.length; vi++) {
      if (dist(zone.points[vi], p) <= HIT_VERTEX) {
        return { id: zone.id, part: 'vertex', vertexIndex: vi };
      }
    }
    if (zone.points.length >= 3 && pointInPolygon(p, zone.points)) {
      return { id: zone.id, part: 'body' };
    }
  }
  return null;
}

function pointInPolygon(pt: Point, poly: Point[]): boolean {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i].x;
    const yi = poly[i].y;
    const xj = poly[j].x;
    const yj = poly[j].y;
    const denom = yj - yi;
    const intersect =
      yi !== yj && yi > pt.y !== yj > pt.y && pt.x < ((xj - xi) * (pt.y - yi)) / denom + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

export function collectPickTargets(
  p: Point,
  walls: WallSegment[],
  zones: RoomZone[],
  tables: PlanTable[],
  chairs: PlanChair[],
  windows: PlanWindow[],
  pxPerMeter: number,
  fixtures: PlanFixture[] = [],
  doors: PlanDoor[] = [],
  stairs: PlanStair[] = [],
): PickTarget[] {
  const hits: PickTarget[] = [];

  const fx = hitTestFixture(fixtures, p, pxPerMeter);
  if (fx) hits.push({ kind: 'fixture', id: fx.id, priority: PRIORITY.fixture });

  const ch = hitTestChair(chairs, p, pxPerMeter);
  if (ch) hits.push({ kind: 'chair', id: ch.id, priority: PRIORITY.chair });

  const tb = hitTestTable(tables, p, pxPerMeter);
  if (tb) hits.push({ kind: 'table', id: tb.id, priority: PRIORITY.table });

  const dr = hitTestDoor(doors, walls, p);
  if (dr) hits.push({ kind: 'door', id: dr.id, priority: PRIORITY.door });

  const st = hitTestStair(stairs, p, pxPerMeter);
  if (st) hits.push({ kind: 'stair', id: st.id, priority: PRIORITY.stair });

  const wn = hitTestWindow(windows, walls, p);
  if (wn) hits.push({ kind: 'window', id: wn.id, priority: PRIORITY.window });

  const wh = hitTestWallAt(walls, p);
  if (wh) hits.push({ kind: 'wall', id: wh.id, priority: PRIORITY.wall, wallPart: wh.part });

  const zh = hitTestZoneAt(zones, p);
  if (zh) {
    hits.push({
      kind: zh.part === 'vertex' ? 'zone-vertex' : 'zone-body',
      id: zh.id,
      priority: zh.part === 'vertex' ? PRIORITY['zone-vertex'] : PRIORITY['zone-body'],
      zoneVertexIndex: zh.vertexIndex,
    });
  }

  hits.sort((a, b) => a.priority - b.priority);
  return hits;
}

export function pickTopTarget(targets: PickTarget[]): PickTarget | null {
  return targets[0] ?? null;
}
