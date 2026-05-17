/** Wall band polygons with rounded welded joints */

import type { Point } from './layout-pick';

export type WallSegment = { id: string; start: Point; end: Point };

export function weldPointKey(p: Point, eps = 4): string {
  return `${Math.round(p.x / eps)}_${Math.round(p.y / eps)}`;
}

function dist(a: Point, b: Point) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function unitFrom(a: Point, b: Point): Point {
  const d = dist(a, b) || 1;
  return { x: (b.x - a.x) / d, y: (b.y - a.y) / d };
}

type JointInfo = { point: Point; dirs: Point[] };

function buildJoints(walls: WallSegment[], eps: number): Map<string, JointInfo> {
  const map = new Map<string, JointInfo>();
  for (const w of walls) {
    const pairs: Array<[Point, Point]> = [
      [w.start, w.end],
      [w.end, w.start],
    ];
    for (const [vertex, other] of pairs) {
      const key = weldPointKey(vertex, eps);
      const dir = unitFrom(vertex, other);
      const j = map.get(key);
      if (j) j.dirs.push(dir);
      else map.set(key, { point: vertex, dirs: [dir] });
    }
  }
  return map;
}

/** Trim distance along wall centerline so round cap / joint circle fits. */
function trimLengthAtJoint(half: number, dirs: Point[]): number {
  if (dirs.length < 2) return half;
  let minAngle = Math.PI;
  for (let i = 0; i < dirs.length; i++) {
    for (let j = i + 1; j < dirs.length; j++) {
      const dot = Math.max(-1, Math.min(1, dirs[i].x * dirs[j].x + dirs[i].y * dirs[j].y));
      minAngle = Math.min(minAngle, Math.acos(dot));
    }
  }
  const a = Math.max(0.2, minAngle / 2);
  return Math.min(half / Math.tan(a), half * 8);
}

export function trimWallSegment(
  w: WallSegment,
  thickness: number,
  joints: Map<string, JointInfo>,
  eps = 4,
): WallSegment {
  const half = thickness / 2;
  let start = { ...w.start };
  let end = { ...w.end };
  const len = dist(start, end);
  if (len < 1) return { ...w, start, end };

  const sk = weldPointKey(start, eps);
  const ek = weldPointKey(end, eps);
  const sj = joints.get(sk);
  const ej = joints.get(ek);

  if (sj && sj.dirs.length >= 2) {
    const t = trimLengthAtJoint(half, sj.dirs);
    if (len > t + 1) {
      const u = unitFrom(start, end);
      start = { x: start.x + u.x * t, y: start.y + u.y * t };
    }
  }
  if (ej && ej.dirs.length >= 2) {
    const t = trimLengthAtJoint(half, ej.dirs);
    const len2 = dist(start, end);
    if (len2 > t + 1) {
      const u = unitFrom(end, start);
      end = { x: end.x + u.x * t, y: end.y + u.y * t };
    }
  }
  return { id: w.id, start, end };
}

export function wallBandPoints(w: WallSegment, thickness: number): Point[] {
  const half = thickness / 2;
  const dx = w.end.x - w.start.x;
  const dy = w.end.y - w.start.y;
  const L = Math.hypot(dx, dy) || 1;
  const nx = (-dy / L) * half;
  const ny = (dx / L) * half;
  return [
    { x: w.start.x + nx, y: w.start.y + ny },
    { x: w.end.x + nx, y: w.end.y + ny },
    { x: w.end.x - nx, y: w.end.y - ny },
    { x: w.start.x - nx, y: w.start.y - ny },
  ];
}

export function collectWallJointCircles(
  walls: WallSegment[],
  thickness: number,
  eps = 4,
): Array<{ x: number; y: number; r: number }> {
  const joints = buildJoints(walls, eps);
  const half = thickness / 2;
  const out: Array<{ x: number; y: number; r: number }> = [];
  for (const j of joints.values()) {
    if (j.dirs.length >= 2) {
      out.push({ x: j.point.x, y: j.point.y, r: half });
    }
  }
  return out;
}

export function buildWallJointsMap(walls: WallSegment[], eps = 4) {
  return buildJoints(walls, eps);
}

/** Round cap at free (non-welded) ends */
export function collectWallEndCaps(
  walls: WallSegment[],
  thickness: number,
  eps = 4,
): Array<{ x: number; y: number; r: number }> {
  const joints = buildJoints(walls, eps);
  const half = thickness / 2;
  const caps: Array<{ x: number; y: number; r: number }> = [];
  for (const w of walls) {
    for (const pt of [w.start, w.end]) {
      const j = joints.get(weldPointKey(pt, eps));
      if (!j || j.dirs.length < 2) {
        caps.push({ x: pt.x, y: pt.y, r: half });
      }
    }
  }
  return caps;
}
