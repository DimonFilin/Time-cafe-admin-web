import type { Point } from './layout-furniture';
import { furnitureOrientedCorners } from './layout-furniture';
import type { PlanChair, PlanTable } from './layout-furniture';
import type { PlanFixture } from './layout-fixtures';
import type { PlanStair } from './layout-stairs';

const COLLISION_GAP_PX = 2;

type PlacedBody = {
  id: string;
  kind: 'table' | 'chair' | 'fixture' | 'stair';
  corners: Point[];
};

function projectPolygon(axis: Point, poly: Point[]) {
  let min = Infinity;
  let max = -Infinity;
  for (const p of poly) {
    const proj = p.x * axis.x + p.y * axis.y;
    min = Math.min(min, proj);
    max = Math.max(max, proj);
  }
  return { min, max };
}

function overlapsOnAxis(axis: Point, a: Point[], b: Point[], gap: number) {
  const pa = projectPolygon(axis, a);
  const pb = projectPolygon(axis, b);
  return pa.max + gap >= pb.min && pb.max + gap >= pa.min;
}

/** SAT overlap test for two convex polygons (rotated furniture footprints). */
export function convexPolygonsOverlap(a: Point[], b: Point[], gap = COLLISION_GAP_PX) {
  if (a.length < 3 || b.length < 3) return false;
  const axes: Point[] = [];
  for (const poly of [a, b]) {
    for (let i = 0; i < poly.length; i++) {
      const p1 = poly[i];
      const p2 = poly[(i + 1) % poly.length];
      const edge = { x: p2.x - p1.x, y: p2.y - p1.y };
      const len = Math.hypot(edge.x, edge.y);
      if (len < 1e-9) continue;
      axes.push({ x: -edge.y / len, y: edge.x / len });
    }
  }
  for (const axis of axes) {
    if (!overlapsOnAxis(axis, a, b, gap)) return false;
  }
  return true;
}

function toBody(
  kind: PlacedBody['kind'],
  item: { id: string; x: number; y: number; widthM: number; heightM: number; rotationDeg?: number },
  pxPerMeter: number,
): PlacedBody {
  return {
    id: item.id,
    kind,
    corners: furnitureOrientedCorners(item, pxPerMeter),
  };
}

export type PlacementCollisionIds = {
  tableIds: Set<string>;
  chairIds: Set<string>;
  fixtureIds: Set<string>;
  stairIds: Set<string>;
};

export function findPlacementCollisionIds(
  tables: PlanTable[],
  chairs: PlanChair[],
  fixtures: PlanFixture[],
  stairs: PlanStair[],
  pxPerMeter: number,
): PlacementCollisionIds {
  const tableIds = new Set<string>();
  const chairIds = new Set<string>();
  const fixtureIds = new Set<string>();
  const stairIds = new Set<string>();

  const bodies: PlacedBody[] = [
    ...tables.map((t) => toBody('table', t, pxPerMeter)),
    ...chairs.map((c) => toBody('chair', c, pxPerMeter)),
    ...fixtures.filter((f) => !f.skipCollision).map((f) => toBody('fixture', f, pxPerMeter)),
    ...stairs.map((s) => toBody('stair', s, pxPerMeter)),
  ];

  const mark = (a: PlacedBody, b: PlacedBody) => {
    const add = (body: PlacedBody) => {
      if (body.kind === 'table') tableIds.add(body.id);
      else if (body.kind === 'chair') chairIds.add(body.id);
      else if (body.kind === 'fixture') fixtureIds.add(body.id);
      else stairIds.add(body.id);
    };
    add(a);
    add(b);
  };

  for (let i = 0; i < bodies.length; i++) {
    for (let j = i + 1; j < bodies.length; j++) {
      if (convexPolygonsOverlap(bodies[i].corners, bodies[j].corners)) {
        mark(bodies[i], bodies[j]);
      }
    }
  }

  return { tableIds, chairIds, fixtureIds, stairIds };
}

export function orientedItemIntersectsNormRect(
  item: { x: number; y: number; widthM: number; heightM: number; rotationDeg?: number },
  r: { x: number; y: number; w: number; h: number },
  pxPerMeter: number,
) {
  const poly = furnitureOrientedCorners(item, pxPerMeter);
  const rect: Point[] = [
    { x: r.x, y: r.y },
    { x: r.x + r.w, y: r.y },
    { x: r.x + r.w, y: r.y + r.h },
    { x: r.x, y: r.y + r.h },
  ];
  return convexPolygonsOverlap(poly, rect, 0);
}

/** Axis-aligned bounds of the rotated footprint (for labels / fallbacks). */
export function orientedBoundsPx(
  item: { x: number; y: number; widthM: number; heightM: number; rotationDeg?: number },
  pxPerMeter: number,
) {
  const corners = furnitureOrientedCorners(item, pxPerMeter);
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const p of corners) {
    minX = Math.min(minX, p.x);
    minY = Math.min(minY, p.y);
    maxX = Math.max(maxX, p.x);
    maxY = Math.max(maxY, p.y);
  }
  return { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
}
