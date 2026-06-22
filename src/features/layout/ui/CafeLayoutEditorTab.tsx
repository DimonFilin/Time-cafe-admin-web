'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  type PlanChair,
  type PlanTable,
  type TableShape,
  furnitureTransform,
  chairToElement,
  cloneChairs,
  cloneTables,
  extractChairs,
  extractTables,
  findFurnitureCollisionIds,
  furnitureBoundsPx,
  furnitureIntersectsNormRect,
  hitTestChair,
  hitTestTable,
  readChairPresets,
  readTablePresets,
  tableToElement,
  visitFurniturePoints,
} from './layout-furniture';
import { CurrencyUnitLabel } from '@/shared/ui/currency/CurrencyUnitLabel';
import { LayoutEditInspector, type LayoutEditFocus } from './LayoutEditInspector';
import { LayoutPlacementPanel } from './LayoutPlacementPanel';
import {
  DEFAULT_CHAIR_DRAFT,
  DEFAULT_TABLE_DRAFT,
  DEFAULT_WINDOW_DRAFT,
  type PlacementDraft,
  type PlacementPreset,
  readPlacementDefaults,
  readPresetList,
} from './layout-placement';
import {
  type PlanWindow,
  type WindowPreset,
  cloneWindows,
  extractWindows,
  hitTestWindow,
  proposeWindowPlacement,
  readWindowDefaults,
  readWindowPresets,
  removeWindowsOnWalls,
  sanitizeWindows,
  slideWindowAlongWall,
  windowDrawParts,
  windowIntersectsNormRect,
  windowOpeningPath,
  windowWallCutPath,
  windowToElement,
  visitWindowPoints,
  WALL_SNAP_DIST,
} from './layout-windows';
import { collectPickTargets, pickTopTarget, type PickTarget } from './layout-pick';
import {
  buildWallJointsMap,
  collectWallEndCaps,
  collectWallJointCircles,
  trimWallSegment,
  wallBandPoints,
} from './layout-wall-render';
import {
  CHAIR_VARIANTS,
  DOOR_KINDS,
  DOOR_SWINGS,
  INTERIOR_TOOLS,
  SOFA_STYLES,
  STAIR_KINDS,
  STRUCTURE_TOOLS,
  type ChairVariant,
  type DoorKind,
  type DoorSwing,
  type InteriorTool,
  type PlanGroup,
  type SofaStyle,
  type StairKind,
  type StructureTool,
} from './layout-editor-catalog';
import { ChairShape } from './layout-chair-render';
import {
  cloneDoors,
  doorDrawParts,
  doorIntersectsNormRect,
  doorToElement,
  doorWallCutPath,
  extractDoors,
  hitTestDoor,
  proposeDoorPlacement,
  type PlanDoor,
} from './layout-doors';
import { DoorSymbol } from './layout-door-render';
import { FixtureShape } from './layout-fixture-render';
import {
  cloneFixtures,
  defaultFixture,
  extractFixtures,
  findFixtureCollisionIds,
  hitTestFixture,
  fixtureToElement,
  type FixtureKind,
  type PlanFixture,
} from './layout-fixtures';
import {
  cloneStairs,
  defaultStair,
  extractStairs,
  hitTestStair,
  stairToElement,
  type PlanStair,
} from './layout-stairs';
import { StairShape } from './layout-stair-render';
import { readPlanBackground, type PlanBackgroundImage } from './layout-plan-background';
import { newLayoutId } from './layout-id';
import { billingModesAvailable, parseRoomBilling, patchRoomBilling } from './room-billing';
import type {
  EditorRoomRecord,
  EditorStatePayload,
  LayoutElementRecord,
  OccupancyPayload,
  OccupancyRoomRow,
} from './layout-api-types';

type CafeOption = { id: string; name: string };

type EditorState = EditorStatePayload;

const todayYmd = () => new Date().toISOString().slice(0, 10);
const MIN_CANVAS_WIDTH = 1200;
const MIN_CANVAS_HEIGHT = 700;
const MAX_CANVAS_DIM = 4000;
const CANVAS_GEOM_PADDING = 120;
const GRID_STEP = 20;
/** One grid step (20 px) = 10 cm in real space */
const METERS_PER_PX = 0.1 / GRID_STEP;
/** Pixels per one meter in plan coordinates (inverse of METERS_PER_PX) */
const PX_PER_METER = GRID_STEP / 0.1;
const DELETE_MARQUEE_PX = 6;
const SNAP_DISTANCE = 14;
const HISTORY_LIMIT = 50;
/** Default zoom: ~10% more plan visible; UI «100%» = this value */
const CANVAS_BASE_ZOOM = 0.9;
const EDIT_STACK_CYCLE_MS = 4000;
const DEFAULT_WALL_THICKNESS_PX = 10;

type Point = { x: number; y: number };
type WallSegment = { id: string; start: Point; end: Point };
type RoomZone = { id: string; points: Point[]; roomId: string | null };
type DrawMode =
  | 'WALL'
  | 'ROOM'
  | 'TABLE'
  | 'CHAIR'
  | 'WINDOW'
  | 'DOOR'
  | 'STAIR'
  | 'FIXTURE'
  | 'EDIT'
  | 'DELETE';

const WELD_EPS = 4;

type WallEndpointRef = { wallId: string; end: 'start' | 'end' };

type EditFocus =
  | null
  | { type: 'wall'; id: string }
  | { type: 'zone'; id: string }
  | { type: 'table'; id: string }
  | { type: 'chair'; id: string }
  | { type: 'window'; id: string }
  | { type: 'fixture'; id: string }
  | { type: 'stair'; id: string }
  | { type: 'door'; id: string };

type DeleteHover =
  | { kind: 'wall'; id: string }
  | { kind: 'zone'; id: string; part: 'body' | 'vertex'; vertexIndex?: number }
  | { kind: 'table'; id: string }
  | { kind: 'chair'; id: string }
  | { kind: 'window'; id: string }
  | { kind: 'door'; id: string }
  | { kind: 'fixture'; id: string }
  | { kind: 'stair'; id: string };

const HIT_VERTEX = 14;
const HIT_WALL_BODY = 10;

type EditDragState =
  | {
      kind: 'wall-body';
      wallId: string;
      grab: Point;
      wall0: WallSegment;
      weldStartRefs: WallEndpointRef[];
      weldEndRefs: WallEndpointRef[];
    }
  | {
      kind: 'wall-end';
      wallId: string;
      end: 'start' | 'end';
      fixed: Point;
      wall0: WallSegment;
      weldRefs: WallEndpointRef[];
    }
  | {
      kind: 'zone-body';
      zoneId: string;
      grab: Point;
      points0: Point[];
    }
  | {
      kind: 'zone-rotate';
      zoneId: string;
      center: Point;
      points0: Point[];
      startAngle: number;
    }
  | {
      kind: 'zone-vertex';
      zoneId: string;
      vertexIndex: number;
      anchor: Point;
      points0: Point[];
    }
  | {
      kind: 'table-body';
      tableId: string;
      grab: Point;
      table0: PlanTable;
    }
  | {
      kind: 'chair-body';
      chairId: string;
      grab: Point;
      chair0: PlanChair;
    }
  | {
      kind: 'window-body';
      windowId: string;
      window0: PlanWindow;
    }
  | {
      kind: 'fixture-body';
      fixtureId: string;
      grab: Point;
      fixture0: PlanFixture;
    }
  | {
      kind: 'stair-body';
      stairId: string;
      grab: Point;
      stair0: PlanStair;
    };

function round2(value: number) {
  return Math.round(value * 100) / 100;
}

function rotatePointsAround(points: Point[], center: Point, deltaDeg: number): Point[] {
  const rad = (deltaDeg * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  return points.map((p) => {
    const dx = p.x - center.x;
    const dy = p.y - center.y;
    return {
      x: round2(center.x + dx * cos - dy * sin),
      y: round2(center.y + dx * sin + dy * cos),
    };
  });
}

function resolveRotatePick(stack: PickTarget[], index: number): PickTarget | null {
  const ordered: PickTarget[] = [];
  if (stack[index]) ordered.push(stack[index]);
  for (let i = 0; i < stack.length; i++) {
    if (i !== index && stack[i]) ordered.push(stack[i]);
  }
  for (const t of ordered) {
    if (
      t.kind === 'table' ||
      t.kind === 'chair' ||
      t.kind === 'zone-body' ||
      t.kind === 'fixture' ||
      t.kind === 'stair'
    ) {
      return t;
    }
  }
  return null;
}

function readPlanFieldMeters(schema: unknown): { widthM: number; heightM: number } {
  const root =
    schema && typeof schema === 'object' && schema !== null
      ? (schema as Record<string, unknown>)
      : null;
  const raw = root?.editorPlanFieldM;
  const m =
    raw && typeof raw === 'object' && raw !== null ? (raw as Record<string, unknown>) : null;
  const widthM = Math.min(120, Math.max(2, Number(m?.widthM) || 6));
  const heightM = Math.min(120, Math.max(2, Number(m?.heightM) || 4));
  return { widthM, heightM };
}

function planFieldMinPx(field: { widthM: number; heightM: number }) {
  return {
    w: Math.min(MAX_CANVAS_DIM, field.widthM * PX_PER_METER),
    h: Math.min(MAX_CANVAS_DIM, field.heightM * PX_PER_METER),
  };
}

function computeCanvasContentSize(
  walls: WallSegment[],
  roomZones: RoomZone[],
  tables: PlanTable[],
  chairs: PlanChair[],
  windows: PlanWindow[],
  draftWallStart: Point | null,
  draftRoomPoints: Point[],
  wallPreviewEnd: Point | null,
  roomPreviewEnd: Point | null,
  fieldMinPx: { w: number; h: number },
): { w: number; h: number } {
  let maxX = 0;
  let maxY = 0;
  let any = false;
  const visit = (p: Point) => {
    any = true;
    maxX = Math.max(maxX, p.x);
    maxY = Math.max(maxY, p.y);
  };
  for (const w of walls) {
    visit(w.start);
    visit(w.end);
  }
  for (const z of roomZones) {
    for (const p of z.points) visit(p);
  }
  if (draftWallStart) visit(draftWallStart);
  for (const p of draftRoomPoints) visit(p);
  if (wallPreviewEnd) visit(wallPreviewEnd);
  if (roomPreviewEnd) visit(roomPreviewEnd);
  visitFurniturePoints(tables, chairs, visit);
  visitWindowPoints(windows, walls, visit);

  if (!any) {
    return {
      w: Math.min(MAX_CANVAS_DIM, Math.max(MIN_CANVAS_WIDTH, fieldMinPx.w)),
      h: Math.min(MAX_CANVAS_DIM, Math.max(MIN_CANVAS_HEIGHT, fieldMinPx.h)),
    };
  }
  const w = Math.min(
    MAX_CANVAS_DIM,
    Math.max(MIN_CANVAS_WIDTH, maxX + CANVAS_GEOM_PADDING, fieldMinPx.w),
  );
  const h = Math.min(
    MAX_CANVAS_DIM,
    Math.max(MIN_CANVAS_HEIGHT, maxY + CANVAS_GEOM_PADDING, fieldMinPx.h),
  );
  return { w, h };
}

function distance(a: Point, b: Point) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function toCanvasPoint(svg: SVGSVGElement, clientX: number, clientY: number): Point {
  const vb = svg.viewBox?.baseVal;
  const maxW = vb && Number.isFinite(vb.width) && vb.width > 0 ? vb.width : MIN_CANVAS_WIDTH;
  const maxH = vb && Number.isFinite(vb.height) && vb.height > 0 ? vb.height : MIN_CANVAS_HEIGHT;
  const svgPoint = svg.createSVGPoint();
  svgPoint.x = clientX;
  svgPoint.y = clientY;
  const ctm = svg.getScreenCTM();
  if (ctm) {
    try {
      const inv = ctm.inverse();
      const p = svgPoint.matrixTransform(inv);
      if (Number.isFinite(p.x) && Number.isFinite(p.y)) {
        return {
          x: Math.min(maxW, Math.max(0, round2(p.x))),
          y: Math.min(maxH, Math.max(0, round2(p.y))),
        };
      }
    } catch {
      // singular matrix — fall through to rect mapping
    }
  }
  const rect = svg.getBoundingClientRect();
  const vw = vb?.width || maxW;
  const vh = vb?.height || maxH;
  const relX = clientX - rect.left;
  const relY = clientY - rect.top;
  const x = (relX / rect.width) * vw;
  const y = (relY / rect.height) * vh;
  return {
    x: Math.min(maxW, Math.max(0, round2(x))),
    y: Math.min(maxH, Math.max(0, round2(y))),
  };
}

function snapToGrid(point: Point): Point {
  return {
    x: Math.round(point.x / GRID_STEP) * GRID_STEP,
    y: Math.round(point.y / GRID_STEP) * GRID_STEP,
  };
}

function extractWalls(elements: LayoutElementRecord[]): WallSegment[] {
  return (elements || [])
    .filter((el) => el?.elementType === 'WALL')
    .map((el) => {
      const g = (el.geometry || {}) as Record<string, unknown>;
      const x1 = Number(g.x1);
      const y1 = Number(g.y1);
      const x2 = Number(g.x2);
      const y2 = Number(g.y2);
      if (![x1, y1, x2, y2].every(Number.isFinite)) return null;
      return {
        id: String(el.id || newLayoutId()),
        start: { x: x1, y: y1 },
        end: { x: x2, y: y2 },
      } satisfies WallSegment;
    })
    .filter(Boolean) as WallSegment[];
}

function extractRoomZones(elements: LayoutElementRecord[]): RoomZone[] {
  return (elements || [])
    .filter((el) => el?.elementType === 'ROOM_ZONE')
    .map((el) => {
      const geom = el.geometry && typeof el.geometry === 'object' ? el.geometry : {};
      const pointsRaw = (geom as Record<string, unknown>).points;
      if (!Array.isArray(pointsRaw) || pointsRaw.length < 3) return null;
      const points = pointsRaw
        .map((p: unknown) => {
          const pt = p && typeof p === 'object' ? (p as Record<string, unknown>) : {};
          return { x: Number(pt.x), y: Number(pt.y) };
        })
        .filter((p: Point) => Number.isFinite(p.x) && Number.isFinite(p.y));
      if (points.length < 3) return null;
      return {
        id: String(el.id || newLayoutId()),
        points,
        roomId: el.props && typeof el.props.roomId === 'string' ? el.props.roomId : null,
      } satisfies RoomZone;
    })
    .filter(Boolean) as RoomZone[];
}

function wallToElement(wall: WallSegment) {
  return {
    id: wall.id,
    elementType: 'WALL',
    name: 'Wall',
    geometry: {
      x1: round2(wall.start.x),
      y1: round2(wall.start.y),
      x2: round2(wall.end.x),
      y2: round2(wall.end.y),
    },
    props: { thickness: 6 },
  };
}

function roomZoneToElement(zone: RoomZone) {
  return {
    id: zone.id,
    elementType: 'ROOM_ZONE',
    name: 'Room zone',
    geometry: {
      points: zone.points.map((p) => ({ x: round2(p.x), y: round2(p.y) })),
    },
    props: {
      roomId: zone.roomId,
    },
  };
}

function nearestPoint(points: Point[], target: Point) {
  let min = Number.POSITIVE_INFINITY;
  let best: Point | null = null;
  for (const p of points) {
    const d = distance(p, target);
    if (d < min) {
      min = d;
      best = p;
    }
  }
  return min <= SNAP_DISTANCE ? best : null;
}

/** Shift: only horizontal / vertical segments from `start` (CAD-style ortho). */
function constrainOrthoHV(start: Point, point: Point): Point {
  const dx = point.x - start.x;
  const dy = point.y - start.y;
  if (Math.abs(dx) >= Math.abs(dy)) {
    return { x: round2(point.x), y: round2(start.y) };
  }
  return { x: round2(start.x), y: round2(point.y) };
}

/** Shift + body drag: move only horizontally or vertically (dominant axis). */
function orthoDelta(from: Point, to: Point): Point {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  if (Math.abs(dx) >= Math.abs(dy)) {
    return { x: round2(dx), y: 0 };
  }
  return { x: 0, y: round2(dy) };
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

function hitTestWall(
  wallsList: WallSegment[],
  p: Point,
): { wall: WallSegment; part: 'start' | 'end' | 'body' } | null {
  let best: { wall: WallSegment; part: 'start' | 'end' | 'body'; d2: number } | null = null;
  for (const wall of wallsList) {
    const ds = distance(wall.start, p);
    const de = distance(wall.end, p);
    if (ds <= HIT_VERTEX) {
      const d2 = ds * ds;
      if (!best || d2 < best.d2) best = { wall, part: 'start', d2 };
    }
    if (de <= HIT_VERTEX) {
      const d2 = de * de;
      if (!best || d2 < best.d2) best = { wall, part: 'end', d2 };
    }
    const d2 = distPointToSegmentSquared(p, wall.start, wall.end);
    const lim = HIT_WALL_BODY * HIT_WALL_BODY;
    if (d2 <= lim) {
      if (!best || d2 < best.d2) best = { wall, part: 'body', d2 };
    }
  }
  return best ? { wall: best.wall, part: best.part } : null;
}

function hitTestZone(
  zones: RoomZone[],
  p: Point,
): { zone: RoomZone; part: 'vertex'; index: number } | { zone: RoomZone; part: 'body' } | null {
  for (const zone of zones) {
    for (let i = 0; i < zone.points.length; i++) {
      if (distance(zone.points[i], p) <= HIT_VERTEX) {
        return { zone, part: 'vertex', index: i };
      }
    }
  }
  for (let zi = zones.length - 1; zi >= 0; zi--) {
    const zone = zones[zi];
    if (zone.points.length >= 3 && pointInPolygon(p, zone.points)) {
      return { zone, part: 'body' };
    }
  }
  return null;
}

function cloneWalls(wallsList: WallSegment[]): WallSegment[] {
  return wallsList.map((w) => ({
    ...w,
    start: { ...w.start },
    end: { ...w.end },
  }));
}

function weldPointsEqual(a: Point, b: Point) {
  return distance(a, b) <= WELD_EPS;
}

function collectEndpointsAt(wallsList: WallSegment[], pt: Point): WallEndpointRef[] {
  const refs: WallEndpointRef[] = [];
  for (const w of wallsList) {
    if (weldPointsEqual(w.start, pt)) refs.push({ wallId: w.id, end: 'start' });
    if (weldPointsEqual(w.end, pt)) refs.push({ wallId: w.id, end: 'end' });
  }
  return refs;
}

function applyWallRefs(
  wallsList: WallSegment[],
  refs: WallEndpointRef[],
  newPt: Point,
): WallSegment[] {
  const out = cloneWalls(wallsList);
  const p = { x: round2(newPt.x), y: round2(newPt.y) };
  for (const ref of refs) {
    const w = out.find((x) => x.id === ref.wallId);
    if (!w) continue;
    if (ref.end === 'start') {
      w.start.x = p.x;
      w.start.y = p.y;
    } else {
      w.end.x = p.x;
      w.end.y = p.y;
    }
  }
  return out;
}

function filterWallsForEdit(wallsList: WallSegment[], focus: EditFocus): WallSegment[] {
  if (!focus) return wallsList;
  if (focus.type === 'wall') return wallsList.filter((w) => w.id === focus.id);
  return [];
}

function filterZonesForEdit(zonesList: RoomZone[], focus: EditFocus): RoomZone[] {
  if (!focus) return zonesList;
  if (focus.type === 'zone') return zonesList.filter((z) => z.id === focus.id);
  return [];
}

function filterTablesForEdit(tablesList: PlanTable[], focus: EditFocus): PlanTable[] {
  if (!focus) return tablesList;
  if (focus.type === 'table') return tablesList.filter((t) => t.id === focus.id);
  return [];
}

function filterChairsForEdit(chairsList: PlanChair[], focus: EditFocus): PlanChair[] {
  if (!focus) return chairsList;
  if (focus.type === 'chair') return chairsList.filter((c) => c.id === focus.id);
  return [];
}

function filterWindowsForEdit(windowsList: PlanWindow[], focus: EditFocus): PlanWindow[] {
  if (!focus) return windowsList;
  if (focus.type === 'window') return windowsList.filter((w) => w.id === focus.id);
  return [];
}

function filterFixturesForEdit(fixturesList: PlanFixture[], focus: EditFocus): PlanFixture[] {
  if (!focus) return fixturesList;
  if (focus.type === 'fixture') return fixturesList.filter((f) => f.id === focus.id);
  return [];
}

function filterStairsForEdit(stairsList: PlanStair[], focus: EditFocus): PlanStair[] {
  if (!focus) return stairsList;
  if (focus.type === 'stair') return stairsList.filter((s) => s.id === focus.id);
  return [];
}

function filterDoorsForEdit(doorsList: PlanDoor[], focus: EditFocus): PlanDoor[] {
  if (!focus) return doorsList;
  if (focus.type === 'door') return doorsList.filter((d) => d.id === focus.id);
  return [];
}

type GeometrySnapshot = {
  walls: WallSegment[];
  roomZones: RoomZone[];
  tables: PlanTable[];
  chairs: PlanChair[];
  windows: PlanWindow[];
  fixtures: PlanFixture[];
  doors: PlanDoor[];
  stairs: PlanStair[];
};

const GEOMETRY_ELEMENT_TYPES = [
  'WALL',
  'ROOM_ZONE',
  'TABLE',
  'CHAIR',
  'WINDOW',
  'DOOR',
  'STAIR',
  'SOFA',
  'TOILET',
  'SINK',
  'CABINET',
  'TV',
  'WHITEBOARD',
] as const;

function buildGeometryElements(snap: GeometrySnapshot, cleanWindows: PlanWindow[]) {
  return [
    ...snap.walls.map(wallToElement),
    ...snap.roomZones.map(roomZoneToElement),
    ...snap.tables.map(tableToElement),
    ...snap.chairs.map(chairToElement),
    ...cleanWindows.map(windowToElement),
    ...snap.fixtures.map(fixtureToElement),
    ...snap.doors.map(doorToElement),
    ...snap.stairs.map(stairToElement),
  ];
}

type HistoryKind = 'load' | 'draw' | 'edit' | 'delete' | 'picker' | 'clear';
type GeometryHistoryEntry = { snapshot: GeometrySnapshot; label: string; kind: HistoryKind };
type CommitMeta = { label: string; kind: HistoryKind };

function historyKindRowClass(kind: HistoryKind): string {
  switch (kind) {
    case 'load':
      return 'border-slate-200/90 bg-slate-100/70';
    case 'draw':
      return 'border-sky-200/90 bg-sky-100/60';
    case 'edit':
      return 'border-amber-200/90 bg-amber-100/60';
    case 'delete':
      return 'border-rose-200/90 bg-rose-100/60';
    case 'picker':
      return 'border-emerald-200/90 bg-emerald-100/60';
    case 'clear':
      return 'border-orange-200/90 bg-orange-100/60';
    default:
      return 'border-[rgb(var(--tc-border))] bg-[rgb(var(--tc-surface-1))]/80';
  }
}

function cloneGeometry(
  wallsList: WallSegment[],
  zonesList: RoomZone[],
  tablesList: PlanTable[],
  chairsList: PlanChair[],
  windowsList: PlanWindow[],
  fixturesList: PlanFixture[],
  doorsList: PlanDoor[],
  stairsList: PlanStair[],
): GeometrySnapshot {
  return {
    walls: wallsList.map((w) => ({
      ...w,
      start: { ...w.start },
      end: { ...w.end },
    })),
    roomZones: zonesList.map((z) => ({
      ...z,
      points: z.points.map((p) => ({ ...p })),
    })),
    tables: cloneTables(tablesList),
    chairs: cloneChairs(chairsList),
    windows: cloneWindows(windowsList),
    fixtures: cloneFixtures(fixturesList),
    doors: cloneDoors(doorsList),
    stairs: cloneStairs(stairsList),
  };
}

function geometryEqual(a: GeometrySnapshot, b: GeometrySnapshot): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

/** Proper intersection (not only shared weld endpoint). */
function segmentsCrossInterior(a: Point, b: Point, c: Point, d: Point, eps = 1e-4): boolean {
  const r = { x: b.x - a.x, y: b.y - a.y };
  const s = { x: d.x - c.x, y: d.y - c.y };
  const denom = r.x * s.y - r.y * s.x;
  const qmpx = c.x - a.x;
  const qmpy = c.y - a.y;
  if (Math.abs(denom) < 1e-12) {
    return false;
  }
  const t = (qmpx * s.y - qmpy * s.x) / denom;
  const u = (qmpx * r.y - qmpy * r.x) / denom;
  return t > eps && t < 1 - eps && u > eps && u < 1 - eps;
}

function findIntersectingWallIds(wallsList: WallSegment[]): Set<string> {
  const bad = new Set<string>();
  for (let i = 0; i < wallsList.length; i++) {
    for (let j = i + 1; j < wallsList.length; j++) {
      const w1 = wallsList[i];
      const w2 = wallsList[j];
      if (segmentsCrossInterior(w1.start, w1.end, w2.start, w2.end)) {
        bad.add(w1.id);
        bad.add(w2.id);
      }
    }
  }
  return bad;
}

function polygonCentroid(pts: Point[]): Point {
  if (!pts.length) return { x: 0, y: 0 };
  const s = pts.reduce((a, p) => ({ x: a.x + p.x, y: a.y + p.y }), { x: 0, y: 0 });
  return { x: s.x / pts.length, y: s.y / pts.length };
}

function rectFromTwoPoints(a: Point, b: Point) {
  const x = Math.min(a.x, b.x);
  const y = Math.min(a.y, b.y);
  const w = Math.abs(a.x - b.x);
  const h = Math.abs(a.y - b.y);
  return { x, y, w, h };
}

function pointInNormRect(p: Point, r: { x: number; y: number; w: number; h: number }) {
  return p.x >= r.x && p.x <= r.x + r.w && p.y >= r.y && p.y <= r.y + r.h;
}

function segmentIntersectsNormRect(
  p1: Point,
  p2: Point,
  r: { x: number; y: number; w: number; h: number },
) {
  if (pointInNormRect(p1, r) || pointInNormRect(p2, r)) return true;
  const steps = 28;
  for (let i = 1; i < steps; i++) {
    const t = i / steps;
    const p = { x: p1.x + t * (p2.x - p1.x), y: p1.y + t * (p2.y - p1.y) };
    if (pointInNormRect(p, r)) return true;
  }
  return false;
}

function zoneIntersectsNormRect(
  points: Point[],
  r: { x: number; y: number; w: number; h: number },
) {
  if (points.length < 2) return false;
  const c = polygonCentroid(points);
  if (pointInNormRect(c, r)) return true;
  for (const p of points) {
    if (pointInNormRect(p, r)) return true;
  }
  for (let i = 0; i < points.length; i++) {
    const a = points[i];
    const b = points[(i + 1) % points.length];
    if (segmentIntersectsNormRect(a, b, r)) return true;
  }
  const corners: Point[] = [
    { x: r.x, y: r.y },
    { x: r.x + r.w, y: r.y },
    { x: r.x + r.w, y: r.y + r.h },
    { x: r.x, y: r.y + r.h },
  ];
  for (const q of corners) {
    if (pointInPolygon(q, points)) return true;
  }
  return false;
}

/** True if closed polygons share interior area (edges cross or one contains points of the other). */
function polygonsInteriorOverlap(a: Point[], b: Point[]): boolean {
  const na = a.length;
  const nb = b.length;
  if (na < 3 || nb < 3) return false;
  for (let i = 0; i < na; i++) {
    const p1 = a[i];
    const p2 = a[(i + 1) % na];
    for (let j = 0; j < nb; j++) {
      const p3 = b[j];
      const p4 = b[(j + 1) % nb];
      if (segmentsCrossInterior(p1, p2, p3, p4)) return true;
    }
  }
  for (const p of a) {
    if (pointInPolygon(p, b)) return true;
  }
  for (const p of b) {
    if (pointInPolygon(p, a)) return true;
  }
  const ca = polygonCentroid(a);
  const cb = polygonCentroid(b);
  if (pointInPolygon(ca, b)) return true;
  if (pointInPolygon(cb, a)) return true;
  return false;
}

function findOverlappingRoomZoneIds(zones: RoomZone[]): Set<string> {
  const bad = new Set<string>();
  for (let i = 0; i < zones.length; i++) {
    for (let j = i + 1; j < zones.length; j++) {
      if (polygonsInteriorOverlap(zones[i].points, zones[j].points)) {
        bad.add(zones[i].id);
        bad.add(zones[j].id);
      }
    }
  }
  return bad;
}

function polygonAreaSqM(points: Point[]): number | null {
  if (points.length < 3) return null;
  let sum = 0;
  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    sum += points[j].x * points[i].y - points[i].x * points[j].y;
  }
  const px2 = Math.abs(sum) / 2;
  const m2 = px2 * METERS_PER_PX * METERS_PER_PX;
  return Number.isFinite(m2) ? m2 : null;
}

type EditHover =
  | { kind: 'wall'; id: string; part: 'start' | 'end' | 'body' }
  | { kind: 'zone'; id: string; part: 'body' | 'vertex'; vertexIndex?: number }
  | { kind: 'table'; id: string }
  | { kind: 'chair'; id: string }
  | { kind: 'window'; id: string }
  | { kind: 'fixture'; id: string }
  | { kind: 'stair'; id: string }
  | { kind: 'door'; id: string };

function applyEditGeometry(
  wallsIn: WallSegment[],
  zonesIn: RoomZone[],
  drag: EditDragState,
  snapped: Point,
  shift: boolean,
  canvasW: number,
  canvasH: number,
): { walls: WallSegment[]; roomZones: RoomZone[] } {
  const clamp = (pt: Point): Point => ({
    x: Math.min(canvasW, Math.max(0, round2(pt.x))),
    y: Math.min(canvasH, Math.max(0, round2(pt.y))),
  });

  switch (drag.kind) {
    case 'wall-end': {
      const moved = clamp(shift ? constrainOrthoHV(drag.fixed, snapped) : snapped);
      const wallsOut = applyWallRefs(wallsIn, drag.weldRefs, moved);
      return { walls: wallsOut, roomZones: zonesIn };
    }
    case 'wall-body': {
      let dx = snapped.x - drag.grab.x;
      let dy = snapped.y - drag.grab.y;
      if (shift) {
        const od = orthoDelta(drag.grab, snapped);
        dx = od.x;
        dy = od.y;
      }
      const dA = clamp({
        x: drag.wall0.start.x + dx,
        y: drag.wall0.start.y + dy,
      });
      const dB = clamp({
        x: drag.wall0.end.x + dx,
        y: drag.wall0.end.y + dy,
      });
      let wallsOut = cloneWalls(wallsIn);
      wallsOut = applyWallRefs(wallsOut, drag.weldStartRefs, dA);
      wallsOut = applyWallRefs(wallsOut, drag.weldEndRefs, dB);
      return { walls: wallsOut, roomZones: zonesIn };
    }
    case 'zone-body': {
      let dx = snapped.x - drag.grab.x;
      let dy = snapped.y - drag.grab.y;
      if (shift) {
        const od = orthoDelta(drag.grab, snapped);
        dx = od.x;
        dy = od.y;
      }
      const newPoints = drag.points0.map((q) => clamp({ x: q.x + dx, y: q.y + dy }));
      return {
        walls: wallsIn,
        roomZones: zonesIn.map((z) => (z.id === drag.zoneId ? { ...z, points: newPoints } : z)),
      };
    }
    case 'zone-vertex': {
      const moved = clamp(shift ? constrainOrthoHV(drag.anchor, snapped) : snapped);
      const newPoints = drag.points0.map((q, i) => (i === drag.vertexIndex ? moved : { ...q }));
      return {
        walls: wallsIn,
        roomZones: zonesIn.map((z) => (z.id === drag.zoneId ? { ...z, points: newPoints } : z)),
      };
    }
    case 'zone-rotate':
    case 'table-body':
    case 'chair-body':
    case 'window-body':
    case 'fixture-body':
    case 'stair-body':
      return { walls: wallsIn, roomZones: zonesIn };
  }
}

function roomStatusForZone(
  rooms: Array<{ id?: string; status?: string }>,
  roomId: string | null,
): string {
  if (!roomId) return '';
  return String(rooms.find((r) => r?.id === roomId)?.status ?? 'ACTIVE');
}

function zonePolygonStyle(
  roomId: string | null,
  status: string,
  zoneActive: boolean,
  delZoneBody: boolean,
): { fill: string; stroke: string } {
  if (delZoneBody) {
    return { fill: 'rgba(220,38,38,0.35)', stroke: '#dc2626' };
  }
  if (zoneActive) {
    return { fill: 'rgba(234,88,12,0.15)', stroke: '#ea580c' };
  }
  if (!roomId) {
    return { fill: 'rgba(0,0,0,0.02)', stroke: '#9ca3af' };
  }
  switch (status) {
    case 'INACTIVE':
      return { fill: 'rgba(0,0,0,0.04)', stroke: '#6b7280' };
    case 'MAINTENANCE':
      return { fill: 'rgba(0,0,0,0.05)', stroke: '#78716c' };
    default:
      return { fill: 'rgba(0,0,0,0.03)', stroke: '#a8a29e' };
  }
}

function pickTargetToDeleteHover(t: PickTarget): DeleteHover {
  if (t.kind === 'fixture') return { kind: 'fixture', id: t.id };
  if (t.kind === 'chair') return { kind: 'chair', id: t.id };
  if (t.kind === 'table') return { kind: 'table', id: t.id };
  if (t.kind === 'door') return { kind: 'door', id: t.id };
  if (t.kind === 'stair') return { kind: 'stair', id: t.id };
  if (t.kind === 'window') return { kind: 'window', id: t.id };
  if (t.kind === 'wall') return { kind: 'wall', id: t.id };
  if (t.kind === 'zone-vertex') {
    return { kind: 'zone', id: t.id, part: 'vertex', vertexIndex: t.zoneVertexIndex };
  }
  return { kind: 'zone', id: t.id, part: 'body' };
}

function pickTargetToEditHover(t: PickTarget): EditHover {
  if (t.kind === 'fixture') return { kind: 'fixture', id: t.id };
  if (t.kind === 'chair') return { kind: 'chair', id: t.id };
  if (t.kind === 'table') return { kind: 'table', id: t.id };
  if (t.kind === 'stair') return { kind: 'stair', id: t.id };
  if (t.kind === 'door') return { kind: 'door', id: t.id };
  if (t.kind === 'window') return { kind: 'window', id: t.id };
  if (t.kind === 'wall') {
    return { kind: 'wall', id: t.id, part: t.wallPart || 'body' };
  }
  if (t.kind === 'zone-vertex') {
    return { kind: 'zone', id: t.id, part: 'vertex', vertexIndex: t.zoneVertexIndex };
  }
  return { kind: 'zone', id: t.id, part: 'body' };
}

function isStackTargetActive(
  stack: PickTarget[],
  index: number,
  blinkOn: boolean,
  target: PickTarget,
): boolean {
  if (stack.length <= 1) return true;
  const cur = stack[index];
  if (!cur || cur.kind !== target.kind || cur.id !== target.id) return false;
  return blinkOn;
}

export function CafeLayoutEditorTab({ scope }: { scope: 'cafe-admin' | 'brand-admin' | 'worker' }) {
  const [cafes, setCafes] = useState<CafeOption[]>([]);
  const [cafeId, setCafeId] = useState('');
  const [state, setState] = useState<EditorState>({
    layout: null,
    rooms: [],
    elements: [],
    roomAssets: [],
    sharedAssets: [],
  });
  const [occupancyDate, setOccupancyDate] = useState(todayYmd());
  const [occupancy, setOccupancy] = useState<OccupancyPayload | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [drawMode, setDrawMode] = useState<DrawMode>('WALL');
  const [shiftPressed, setShiftPressed] = useState(false);
  const [walls, setWalls] = useState<WallSegment[]>([]);
  const [roomZones, setRoomZones] = useState<RoomZone[]>([]);
  const [tables, setTables] = useState<PlanTable[]>([]);
  const [chairs, setChairs] = useState<PlanChair[]>([]);
  const [windows, setWindows] = useState<PlanWindow[]>([]);
  const [fixtures, setFixtures] = useState<PlanFixture[]>([]);
  const [doors, setDoors] = useState<PlanDoor[]>([]);
  const [stairs, setStairs] = useState<PlanStair[]>([]);
  const [planGroup, setPlanGroup] = useState<PlanGroup>('structure');
  const [structureTool, setStructureTool] = useState<StructureTool>('wall');
  const [interiorTool, setInteriorTool] = useState<InteriorTool>('table');
  const [chairVariant, setChairVariant] = useState<ChairVariant>('standard');
  const [doorKind, setDoorKind] = useState<DoorKind>('plain');
  const [doorSwing, setDoorSwing] = useState<DoorSwing>('out');
  const [stairKind, setStairKind] = useState<StairKind>('rect');
  const [sofaStyle, setSofaStyle] = useState<SofaStyle>('standard');
  const [fixtureDraft, setFixtureDraft] = useState<PlanFixture>(defaultFixture('sofa'));
  const [doorDraft, setDoorDraft] = useState<PlacementDraft>({
    ...DEFAULT_WINDOW_DRAFT,
    name: 'Дверь',
    widthM: 0.9,
  });
  const [stairDraft, setStairDraft] = useState<PlanStair>(defaultStair('rect'));
  const [editPanelHover, setEditPanelHover] = useState(false);
  const [editStickyTableId, setEditStickyTableId] = useState<string | null>(null);
  const [layoutFullscreen, setLayoutFullscreen] = useState(false);
  const [halfStairPending, setHalfStairPending] = useState<{ pairId: string } | null>(null);
  const [tableDraft, setTableDraft] = useState<PlacementDraft>({ ...DEFAULT_TABLE_DRAFT });
  const [chairDraft, setChairDraft] = useState<PlacementDraft>({ ...DEFAULT_CHAIR_DRAFT });
  const [windowDraft, setWindowDraft] = useState<PlacementDraft>({ ...DEFAULT_WINDOW_DRAFT });
  const [chairPresetPick, setChairPresetPick] = useState<string>('__new__');
  const [tablePresetPick, setTablePresetPick] = useState<string>('__new__');
  const [windowPresetPick, setWindowPresetPick] = useState<string>('__new__');
  const [placeArmed, setPlaceArmed] = useState(true);
  const [editPickStack, setEditPickStack] = useState<PickTarget[]>([]);
  const [editPickIndex, setEditPickIndex] = useState(0);
  const [editStackBlinkOn, setEditStackBlinkOn] = useState(true);
  const [editSubMode, setEditSubMode] = useState<'move' | 'rotate'>('move');
  const [editLockedPick, setEditLockedPick] = useState<PickTarget | null>(null);
  const [tableShapeDraft, setTableShapeDraft] = useState<TableShape>('rect');
  const [wallThicknessPx, setWallThicknessPx] = useState(DEFAULT_WALL_THICKNESS_PX);
  const editPickStackKeyRef = useRef('');
  const [draftWallStart, setDraftWallStart] = useState<Point | null>(null);
  const [draftRoomPoints, setDraftRoomPoints] = useState<Point[]>([]);
  const [cursorPoint, setCursorPoint] = useState<Point | null>(null);
  const [roomPickerZoneId, setRoomPickerZoneId] = useState<string | null>(null);
  const [roomPickerValue, setRoomPickerValue] = useState<string>('');
  const [editHover, setEditHover] = useState<EditHover | null>(null);
  const [editDraggingUi, setEditDraggingUi] = useState(false);
  const [editFocus, setEditFocus] = useState<EditFocus>(null);
  const [deleteHover, setDeleteHover] = useState<DeleteHover | null>(null);
  const [deleteBlinkOn, setDeleteBlinkOn] = useState(false);
  const [deleteMarquee, setDeleteMarquee] = useState<{
    x1: number;
    y1: number;
    x2: number;
    y2: number;
  } | null>(null);
  const deleteSelectActiveRef = useRef(false);
  const deleteClickSuppressRef = useRef(false);
  const detachWallVertexNextRef = useRef<WallEndpointRef | null>(null);
  const snappedCursorRef = useRef<Point | null>(null);
  const editDragRef = useRef<EditDragState | null>(null);
  const geomRef = useRef<GeometrySnapshot>({
    walls: [],
    roomZones: [],
    tables: [],
    chairs: [],
    windows: [],
    fixtures: [],
    doors: [],
    stairs: [],
  });
  const svgRef = useRef<SVGSVGElement | null>(null);
  const canvasScrollRef = useRef<HTMLDivElement | null>(null);
  const geometryHistoryRef = useRef<GeometryHistoryEntry[]>([]);
  const historyCursorRef = useRef(0);
  const historyMenuRef = useRef<HTMLDivElement | null>(null);
  const [historyMenuOpen, setHistoryMenuOpen] = useState(false);
  const [historyUiTick, setHistoryUiTick] = useState(0);
  const [undoAvailable, setUndoAvailable] = useState(0);
  const [redoAvailable, setRedoAvailable] = useState(0);
  const [canvasZoom, setCanvasZoom] = useState(CANVAS_BASE_ZOOM);
  const [saveGeometryIssues, setSaveGeometryIssues] = useState<{
    wallIds: Set<string>;
    zoneIds: Set<string>;
    tableIds: Set<string>;
    chairIds: Set<string>;
    fixtureIds: Set<string>;
  } | null>(null);

  const bumpHistoryUi = () => {
    const h = geometryHistoryRef.current;
    const c = historyCursorRef.current;
    setUndoAvailable(c > 0 ? 1 : 0);
    setRedoAvailable(c < h.length - 1 ? 1 : 0);
    setHistoryUiTick((t) => t + 1);
  };

  const initGeometryHistory = (
    wList: WallSegment[],
    zList: RoomZone[],
    tList: PlanTable[],
    cList: PlanChair[],
    winList: PlanWindow[],
    fixList: PlanFixture[] = [],
    doorList: PlanDoor[] = [],
    stairList: PlanStair[] = [],
  ) => {
    geometryHistoryRef.current = [
      {
        snapshot: cloneGeometry(wList, zList, tList, cList, winList, fixList, doorList, stairList),
        label: 'Загружено',
        kind: 'load',
      },
    ];
    historyCursorRef.current = 0;
    bumpHistoryUi();
  };

  const syncLayoutToState = (snap: GeometrySnapshot) => {
    const cleanWindows = sanitizeWindows(snap.windows, snap.walls);
    setWalls(snap.walls);
    setRoomZones(snap.roomZones);
    setTables(snap.tables);
    setChairs(snap.chairs);
    setWindows(cleanWindows);
    setFixtures(snap.fixtures);
    setDoors(snap.doors);
    setStairs(snap.stairs);
    setState((prev) => {
      const filteredElements = (prev.elements || []).filter(
        (el) =>
          !GEOMETRY_ELEMENT_TYPES.includes(
            el?.elementType as (typeof GEOMETRY_ELEMENT_TYPES)[number],
          ),
      );
      return {
        ...prev,
        elements: [...filteredElements, ...buildGeometryElements(snap, cleanWindows)],
      };
    });
  };

  const commitLayout = (
    snap: Partial<GeometrySnapshot> &
      Pick<GeometrySnapshot, 'walls' | 'roomZones' | 'tables' | 'chairs' | 'windows'>,
    meta: CommitMeta,
  ) => {
    const h = geometryHistoryRef.current;
    const c = historyCursorRef.current;
    const curEntry = h[c];
    const normalized: GeometrySnapshot = {
      walls: snap.walls,
      roomZones: snap.roomZones,
      tables: snap.tables,
      chairs: snap.chairs,
      windows: sanitizeWindows(snap.windows, snap.walls),
      fixtures: snap.fixtures ?? fixtures,
      doors: snap.doors ?? doors,
      stairs: snap.stairs ?? stairs,
    };
    const nxt = cloneGeometry(
      normalized.walls,
      normalized.roomZones,
      normalized.tables,
      normalized.chairs,
      normalized.windows,
      normalized.fixtures,
      normalized.doors,
      normalized.stairs,
    );
    if (curEntry && geometryEqual(curEntry.snapshot, nxt)) return;

    h.splice(c + 1);
    h.push({ snapshot: nxt, label: meta.label, kind: meta.kind });
    while (h.length > HISTORY_LIMIT) {
      h.shift();
    }
    historyCursorRef.current = h.length - 1;
    syncLayoutToState(nxt);
    bumpHistoryUi();
  };

  const commitGeometry = (
    nextWalls: WallSegment[],
    nextRoomZones: RoomZone[],
    meta: CommitMeta,
  ) => {
    commitLayout(
      {
        walls: nextWalls,
        roomZones: nextRoomZones,
        tables,
        chairs,
        windows: sanitizeWindows(windows, nextWalls),
        fixtures,
        doors,
        stairs,
      },
      meta,
    );
  };

  const applySnapshot = (snap: GeometrySnapshot) => {
    syncLayoutToState(
      cloneGeometry(
        snap.walls,
        snap.roomZones,
        snap.tables,
        snap.chairs,
        snap.windows,
        snap.fixtures,
        snap.doors,
        snap.stairs,
      ),
    );
  };

  const persistPlacementMeta = (
    kind: 'table' | 'chair' | 'window',
    draft: PlacementDraft,
    preset?: PlacementPreset | WindowPreset,
  ) => {
    setState((prev) => {
      const prevSchema =
        prev.layout?.schema && typeof prev.layout.schema === 'object' && prev.layout.schema !== null
          ? (prev.layout.schema as Record<string, unknown>)
          : {};
      const defaultsKey =
        kind === 'table'
          ? 'lastTableDefaults'
          : kind === 'chair'
            ? 'lastChairDefaults'
            : 'lastWindowDefaults';
      const presetsKey =
        kind === 'table'
          ? 'editorTablePresets'
          : kind === 'chair'
            ? 'editorChairPresets'
            : 'editorWindowPresets';
      const existing = Array.isArray(prevSchema[presetsKey])
        ? ([...(prevSchema[presetsKey] as PlacementPreset[])] as PlacementPreset[])
        : [];
      let presets = existing;
      if (preset) {
        const idx = presets.findIndex((p) => p.id === preset.id);
        const entry =
          kind === 'window'
            ? { id: preset.id, name: draft.name, widthM: draft.widthM }
            : {
                id: preset.id,
                name: draft.name,
                widthM: draft.widthM,
                depthM: draft.depthM,
                heightM: draft.depthM,
              };
        if (idx >= 0) presets[idx] = entry as PlacementPreset;
        else presets = [...presets, entry as PlacementPreset];
      }
      const defaultsStored =
        kind === 'window'
          ? { name: draft.name, widthM: draft.widthM }
          : { name: draft.name, widthM: draft.widthM, heightM: draft.depthM, depthM: draft.depthM };
      const nextSchema = {
        ...prevSchema,
        [defaultsKey]: defaultsStored,
        [presetsKey]: presets,
      };
      return {
        ...prev,
        layout: prev.layout
          ? { ...prev.layout, schema: nextSchema }
          : {
              title: 'Основная планировка',
              schema: nextSchema,
              previewUrl: null,
              isPublished: false,
            },
      };
    });
  };

  const applyGeometryUndo = () => {
    const h = geometryHistoryRef.current;
    let c = historyCursorRef.current;
    if (c <= 0) return;
    c -= 1;
    historyCursorRef.current = c;
    applySnapshot(h[c].snapshot);
    bumpHistoryUi();
  };

  const applyGeometryRedo = () => {
    const h = geometryHistoryRef.current;
    const c = historyCursorRef.current;
    if (c >= h.length - 1) return;
    historyCursorRef.current = c + 1;
    applySnapshot(h[historyCursorRef.current].snapshot);
    bumpHistoryUi();
  };

  const jumpToHistoryIndex = (index: number) => {
    const h = geometryHistoryRef.current;
    if (index < 0 || index >= h.length) return;
    historyCursorRef.current = index;
    applySnapshot(h[index].snapshot);
    bumpHistoryUi();
    setHistoryMenuOpen(false);
  };

  const snappedCursor = useMemo<Point | null>(() => {
    if (!cursorPoint) return null;
    const allNodes: Point[] = [
      ...walls.flatMap((w) => [w.start, w.end]),
      ...roomZones.flatMap((z) => z.points),
    ];
    const snapNodes =
      drawMode === 'WALL' && draftWallStart
        ? allNodes.filter((p) => distance(p, draftWallStart) >= GRID_STEP / 2)
        : allNodes;
    const nearest = nearestPoint(snapNodes, cursorPoint);
    const base = nearest ?? snapToGrid(cursorPoint);
    if (drawMode === 'WALL' && draftWallStart && shiftPressed) {
      return constrainOrthoHV(draftWallStart, base);
    }
    if (drawMode === 'ROOM' && draftRoomPoints.length > 0 && shiftPressed) {
      return constrainOrthoHV(draftRoomPoints[draftRoomPoints.length - 1], base);
    }
    return base;
  }, [cursorPoint, walls, roomZones, drawMode, draftWallStart, draftRoomPoints, shiftPressed]);

  useEffect(() => {
    snappedCursorRef.current = snappedCursor;
  }, [snappedCursor]);

  geomRef.current = { walls, roomZones, tables, chairs, windows, fixtures, doors, stairs };

  const planFieldM = useMemo(
    () => readPlanFieldMeters(state.layout?.schema),
    [state.layout?.schema],
  );
  const planBackground = useMemo(
    () => readPlanBackground(state.layout?.schema),
    [state.layout?.schema],
  );
  const fieldMinPx = useMemo(() => planFieldMinPx(planFieldM), [planFieldM]);
  const chairPresetOptions = useMemo(
    () =>
      readPresetList(state.layout?.schema, 'editorChairPresets').length
        ? readPresetList(state.layout?.schema, 'editorChairPresets')
        : readChairPresets(state.layout?.schema, chairs).map((p) => ({
            ...p,
            depthM: p.heightM,
          })),
    [state.layout?.schema, chairs],
  );
  const tablePresetOptions = useMemo(
    () =>
      readPresetList(state.layout?.schema, 'editorTablePresets').length
        ? readPresetList(state.layout?.schema, 'editorTablePresets')
        : readTablePresets(state.layout?.schema, tables).map((p) => ({
            ...p,
            depthM: p.heightM,
          })),
    [state.layout?.schema, tables],
  );
  const windowPresetOptions = useMemo(
    () => readWindowPresets(state.layout?.schema, windows),
    [state.layout?.schema, windows],
  );

  const canvasContentSize = useMemo(
    () =>
      computeCanvasContentSize(
        walls,
        roomZones,
        tables,
        chairs,
        windows,
        draftWallStart,
        draftRoomPoints,
        drawMode === 'WALL' && draftWallStart && snappedCursor ? snappedCursor : null,
        drawMode === 'ROOM' && draftRoomPoints.length > 0 && snappedCursor ? snappedCursor : null,
        fieldMinPx,
      ),
    [
      walls,
      roomZones,
      tables,
      chairs,
      windows,
      draftWallStart,
      draftRoomPoints,
      drawMode,
      snappedCursor,
      fieldMinPx,
    ],
  );
  const contentWidth = canvasContentSize.w;
  const contentHeight = canvasContentSize.h;

  const wallJointsMap = useMemo(() => buildWallJointsMap(walls, WELD_EPS), [walls]);

  const selectedCafe = useMemo(() => cafes.find((c) => c.id === cafeId) ?? null, [cafes, cafeId]);

  useEffect(() => {
    const loadCafes = async () => {
      try {
        if (scope === 'cafe-admin') {
          const res = await fetch('/api/cafe-admin/cafe', { credentials: 'include' });
          const json = await res.json();
          const c = json?.cafe ?? json;
          if (c?.id) {
            const option = { id: c.id, name: c.name || 'Cafe' };
            setCafes([option]);
            setCafeId(c.id);
          }
          return;
        }
        if (scope === 'worker') {
          const res = await fetch('/api/cafe-worker/me', { credentials: 'include' });
          const json = await res.json();
          if (json?.cafe?.id) {
            const option = { id: json.cafe.id, name: json.cafe.name || 'Cafe' };
            setCafes([option]);
            setCafeId(json.cafe.id);
          }
          return;
        }
        const res = await fetch('/api/brand/cafes', { credentials: 'include' });
        const json = await res.json();
        const list = (json?.cafes ?? json ?? []).map((c: { id: string; name?: string }) => ({
          id: c.id,
          name: c.name,
        }));
        setCafes(list);
        if (list[0]?.id) setCafeId(list[0].id);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load cafes');
      }
    };
    void loadCafes();
  }, [scope]);

  useEffect(() => {
    if (!deleteHover || drawMode !== 'DELETE') {
      setDeleteBlinkOn(false);
      return;
    }
    const id = setInterval(() => setDeleteBlinkOn((v) => !v), 320);
    return () => clearInterval(id);
  }, [deleteHover, drawMode]);

  useEffect(() => {
    if (drawMode !== 'EDIT' || editPickStack.length <= 1) {
      setEditStackBlinkOn(true);
      return;
    }
    const id = setInterval(() => setEditStackBlinkOn((v) => !v), 320);
    return () => clearInterval(id);
  }, [drawMode, editPickStack.length]);

  const editTableFocused =
    drawMode === 'EDIT' &&
    (editPanelHover || editStickyTableId !== null || editHover?.kind === 'table');

  useEffect(() => {
    if (drawMode !== 'EDIT' || editPickStack.length <= 1 || editTableFocused) return;
    const id = setInterval(() => {
      setEditPickIndex((i) => (i + 1) % editPickStack.length);
    }, EDIT_STACK_CYCLE_MS);
    return () => clearInterval(id);
  }, [drawMode, editPickStack.length, editTableFocused]);

  useEffect(() => {
    if (drawMode !== 'EDIT' || editHover?.kind !== 'table') return;
    const idx = editPickStack.findIndex((t) => t.kind === 'table' && t.id === editHover.id);
    if (idx >= 0) setEditPickIndex(idx);
  }, [drawMode, editHover?.kind, editHover?.id, editPickStack]);

  useEffect(() => {
    if (drawMode !== 'EDIT') return;
    const t = editPickStack[editPickIndex];
    setEditHover(t ? pickTargetToEditHover(t) : null);
  }, [drawMode, editPickStack, editPickIndex]);

  const selectedTableId =
    drawMode === 'EDIT'
      ? editLockedPick?.kind === 'table'
        ? editLockedPick.id
        : editStickyTableId
          ? editStickyTableId
          : editHover?.kind === 'table'
            ? editHover.id
            : null
      : null;

  useEffect(() => {
    if (drawMode !== 'EDIT') {
      setEditStickyTableId(null);
      return;
    }
    if (editPanelHover && selectedTableId) {
      setEditStickyTableId(selectedTableId);
    } else if (editHover?.kind === 'table') {
      setEditStickyTableId(editHover.id);
    } else if (!editPanelHover) {
      setEditStickyTableId(null);
    }
  }, [drawMode, editPanelHover, editHover?.kind, editHover?.id, selectedTableId]);

  const patchTableById = (id: string, patch: Partial<PlanTable>) => {
    const next = tables.map((t) => (t.id === id ? { ...t, ...patch } : t));
    setTables(next);
    geomRef.current = { ...geomRef.current, tables: next };
  };

  const patchSelectedTable = (patch: Partial<PlanTable>) => {
    if (!selectedTableId) return;
    patchTableById(selectedTableId, patch);
  };

  const patchChairById = (id: string, patch: Partial<PlanChair>) => {
    const next = chairs.map((c) => (c.id === id ? { ...c, ...patch } : c));
    setChairs(next);
    geomRef.current = { ...geomRef.current, chairs: next };
  };

  const patchWindowById = (id: string, patch: Partial<PlanWindow>) => {
    const next = windows.map((w) => (w.id === id ? { ...w, ...patch } : w));
    const clean = sanitizeWindows(next, walls);
    setWindows(clean);
    geomRef.current = { ...geomRef.current, windows: clean };
  };

  const patchFixtureById = (id: string, patch: Partial<PlanFixture>) => {
    const next = fixtures.map((f) => (f.id === id ? { ...f, ...patch } : f));
    setFixtures(next);
    geomRef.current = { ...geomRef.current, fixtures: next };
  };

  const patchDoorById = (id: string, patch: Partial<PlanDoor>) => {
    const next = doors.map((d) => (d.id === id ? { ...d, ...patch } : d));
    setDoors(next);
    geomRef.current = { ...geomRef.current, doors: next };
  };

  const patchStairById = (id: string, patch: Partial<PlanStair>) => {
    const next = stairs.map((s) => (s.id === id ? { ...s, ...patch } : s));
    setStairs(next);
    geomRef.current = { ...geomRef.current, stairs: next };
  };

  const patchZoneRoomId = (zoneId: string, roomId: string | null) => {
    const nextZones = roomZones.map((z) => (z.id === zoneId ? { ...z, roomId } : z));
    commitGeometry(walls, nextZones, { label: 'Комната в зоне', kind: 'edit' });
  };

  const updateRoomById = (roomId: string, patch: Record<string, unknown>) => {
    setState((prev) => {
      const idx = prev.rooms.findIndex((r) => r?.id === roomId);
      if (idx < 0) return prev;
      const next = [...prev.rooms];
      next[idx] = { ...next[idx], ...patch };
      return { ...prev, rooms: next };
    });
  };

  const activeEditFocus = useMemo((): LayoutEditFocus | null => {
    if (drawMode !== 'EDIT') return null;
    if (editFocus) return editFocus;
    if (selectedTableId) return { type: 'table', id: selectedTableId };
    return null;
  }, [drawMode, editFocus, selectedTableId]);

  const activeEditZone = useMemo(() => {
    if (activeEditFocus?.type !== 'zone') return null;
    return roomZones.find((z) => z.id === activeEditFocus.id) ?? null;
  }, [activeEditFocus, roomZones]);

  const applyStructureTool = (tool: StructureTool) => {
    setStructureTool(tool);
    setPlanGroup('structure');
    setDraftRoomPoints([]);
    setDraftWallStart(null);
    setEditHover(null);
    setDeleteHover(null);
    setEditFocus(null);
    setPlaceArmed(true);
    if (tool === 'wall') setDrawMode('WALL');
    else if (tool === 'room') setDrawMode('ROOM');
    else if (tool === 'window') setDrawMode('WINDOW');
    else if (tool === 'door') setDrawMode('DOOR');
    else {
      setDrawMode('STAIR');
      setStairDraft(defaultStair(stairKind));
    }
  };

  const applyInteriorTool = (tool: InteriorTool) => {
    setInteriorTool(tool);
    setPlanGroup('interior');
    setDraftWallStart(null);
    setDraftRoomPoints([]);
    setEditHover(null);
    setDeleteHover(null);
    setEditFocus(null);
    setPlaceArmed(true);
    if (tool === 'table') {
      setDrawMode('TABLE');
      setTableDraft(
        readPlacementDefaults(state.layout?.schema, 'lastTableDefaults', DEFAULT_TABLE_DRAFT),
      );
    } else if (tool === 'chair') {
      setDrawMode('CHAIR');
      setChairDraft(
        readPlacementDefaults(state.layout?.schema, 'lastChairDefaults', DEFAULT_CHAIR_DRAFT),
      );
    } else {
      setDrawMode('FIXTURE');
      const kind = tool as FixtureKind;
      setFixtureDraft({ ...defaultFixture(kind), id: '' });
    }
  };

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.shiftKey) setShiftPressed(true);
      if (e.key === 'Escape') {
        setEditFocus(null);
        detachWallVertexNextRef.current = null;
        setSaveGeometryIssues(null);
        setDeleteMarquee(null);
        deleteSelectActiveRef.current = false;
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        const t = e.target as HTMLElement;
        if (t.closest('input, textarea, select, [contenteditable=true]')) return;
        e.preventDefault();
        applyGeometryUndo();
      }
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        const t = e.target as HTMLElement;
        if (t.closest('input, textarea, select, [contenteditable=true]')) return;
        e.preventDefault();
        applyGeometryRedo();
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (!e.shiftKey) setShiftPressed(false);
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, []);

  useEffect(() => {
    if (drawMode !== 'DELETE') {
      setDeleteMarquee(null);
      deleteSelectActiveRef.current = false;
    }
  }, [drawMode]);

  useEffect(() => {
    if (!cafeId) return;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const [editorRes, occupancyRes] = await Promise.all([
          fetch(`/api/cafe-layout/cafes/${cafeId}/editor`, {
            credentials: 'include',
            cache: 'no-store',
          }),
          fetch(
            `/api/cafe-layout/cafes/${cafeId}/occupancy?date=${encodeURIComponent(occupancyDate)}`,
            { credentials: 'include', cache: 'no-store' },
          ),
        ]);
        const editorJson = await editorRes.json();
        const occupancyJson = await occupancyRes.json();
        const ew = extractWalls(editorJson?.elements || []);
        const rz = extractRoomZones(editorJson?.elements || []);
        const et = extractTables(editorJson?.elements || []);
        const ec = extractChairs(editorJson?.elements || []);
        const ewin = extractWindows(editorJson?.elements || []);
        const efix = extractFixtures(editorJson?.elements || []);
        const edoor = extractDoors(editorJson?.elements || []);
        const est = extractStairs(editorJson?.elements || []);
        setState(editorJson);
        setWalls(ew);
        setRoomZones(rz);
        setTables(et);
        setChairs(ec);
        setWindows(sanitizeWindows(ewin, ew));
        setFixtures(efix);
        setDoors(edoor);
        setStairs(est);
        setTableDraft(
          readPlacementDefaults(
            editorJson?.layout?.schema,
            'lastTableDefaults',
            DEFAULT_TABLE_DRAFT,
          ),
        );
        setChairDraft(
          readPlacementDefaults(
            editorJson?.layout?.schema,
            'lastChairDefaults',
            DEFAULT_CHAIR_DRAFT,
          ),
        );
        setWindowDraft({
          name: readWindowDefaults(editorJson?.layout?.schema).name,
          widthM: readWindowDefaults(editorJson?.layout?.schema).widthM,
          depthM: 0,
        });
        setChairPresetPick('__new__');
        setTablePresetPick('__new__');
        setWindowPresetPick('__new__');
        setPlaceArmed(true);
        setDraftWallStart(null);
        setDraftRoomPoints([]);
        setCursorPoint(null);
        setOccupancy(occupancyJson);
        initGeometryHistory(ew, rz, et, ec, sanitizeWindows(ewin, ew), efix, edoor, est);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load layout data');
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [cafeId, occupancyDate]);

  useEffect(() => {
    if (!layoutFullscreen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLayoutFullscreen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [layoutFullscreen]);

  useEffect(() => {
    const el = canvasScrollRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();
      const step = e.deltaY > 0 ? -0.09 : 0.09;
      setCanvasZoom((prev) => clampCanvasZoom(prev + step));
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, []);

  useEffect(() => {
    if (!historyMenuOpen) return;
    const onDoc = (e: MouseEvent) => {
      const el = historyMenuRef.current;
      if (el && !el.contains(e.target as Node)) setHistoryMenuOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [historyMenuOpen]);

  const save = async () => {
    if (!cafeId) return;
    setSaveGeometryIssues(null);
    setSaving(true);
    setError(null);
    try {
      const cleanWin = sanitizeWindows(windows, walls);
      const snap: GeometrySnapshot = {
        walls,
        roomZones,
        tables,
        chairs,
        windows: cleanWin,
        fixtures,
        doors,
        stairs,
      };
      const nonGeometry = (state.elements || []).filter(
        (el) =>
          !GEOMETRY_ELEMENT_TYPES.includes(
            el?.elementType as (typeof GEOMETRY_ELEMENT_TYPES)[number],
          ),
      );
      const payload = {
        ...state,
        elements: [...nonGeometry, ...buildGeometryElements(snap, cleanWin)],
      };
      const res = await fetch(`/api/cafe-layout/cafes/${cafeId}/editor`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json?.message || json?.error || 'Failed to save layout');
      }
      const ew = extractWalls(json?.elements || []);
      const rz = extractRoomZones(json?.elements || []);
      const et = extractTables(json?.elements || []);
      const ec = extractChairs(json?.elements || []);
      const ewin = extractWindows(json?.elements || []);
      setState(json);
      setWalls(ew);
      setRoomZones(rz);
      setTables(et);
      setChairs(ec);
      setWindows(sanitizeWindows(ewin, ew));
      const efix = extractFixtures(json?.elements || []);
      const edoor = extractDoors(json?.elements || []);
      const est = extractStairs(json?.elements || []);
      setFixtures(efix);
      setDoors(edoor);
      setStairs(est);
      initGeometryHistory(ew, rz, et, ec, sanitizeWindows(ewin, ew), efix, edoor, est);
      try {
        const occRes = await fetch(
          `/api/cafe-layout/cafes/${cafeId}/occupancy?date=${encodeURIComponent(occupancyDate)}`,
          { credentials: 'include', cache: 'no-store' },
        );
        if (occRes.ok) setOccupancy(await occRes.json());
      } catch {
        /* keep previous occupancy */
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save layout');
    } finally {
      setSaving(false);
    }
  };

  const requestSave = () => {
    const wallIds = findIntersectingWallIds(walls);
    const zoneIds = findOverlappingRoomZoneIds(roomZones);
    const furnitureHits = findFurnitureCollisionIds(tables, chairs, PX_PER_METER);
    const fixtureIds = findFixtureCollisionIds(fixtures, PX_PER_METER);
    if (
      wallIds.size > 0 ||
      zoneIds.size > 0 ||
      furnitureHits.tableIds.size > 0 ||
      furnitureHits.chairIds.size > 0 ||
      fixtureIds.size > 0
    ) {
      setSaveGeometryIssues({
        wallIds,
        zoneIds,
        tableIds: furnitureHits.tableIds,
        chairIds: furnitureHits.chairIds,
        fixtureIds,
      });
      return;
    }
    void save();
  };

  const updateRoom = (idx: number, patch: Record<string, unknown>) => {
    setState((prev) => {
      const next = [...prev.rooms];
      next[idx] = { ...next[idx], ...patch };
      return { ...prev, rooms: next };
    });
  };

  const roomZonesUsingRoom = (roomId: string | undefined) =>
    roomId ? roomZones.filter((z) => z.roomId === roomId) : [];

  const deleteRoom = (idx: number) => {
    const room = state.rooms[idx];
    if (!room) return;
    const linked = room.id ? roomZonesUsingRoom(room.id) : [];
    if (linked.length > 0) {
      setError(
        `Комнату «${room.name || 'без названия'}» нельзя удалить: она стоит на плане (${linked.length} ${linked.length === 1 ? 'зона' : 'зоны'}). Откройте зону на плане и снимите привязку комнаты.`,
      );
      return;
    }
    setError(null);
    const roomId = room.id as string | undefined;
    setState((prev) => ({
      ...prev,
      rooms: prev.rooms.filter((_, i) => i !== idx),
      roomAssets: roomId
        ? (prev.roomAssets || []).filter((a) => a?.roomId !== roomId)
        : prev.roomAssets,
    }));
  };

  const setPlanBackground = (next: PlanBackgroundImage | null) => {
    setState((prev) => {
      const prevSchema =
        prev.layout?.schema && typeof prev.layout.schema === 'object' && prev.layout.schema !== null
          ? (prev.layout.schema as Record<string, unknown>)
          : {};
      const nextSchema = { ...prevSchema };
      if (next) nextSchema.planBackgroundImage = next;
      else delete nextSchema.planBackgroundImage;
      return {
        ...prev,
        layout: prev.layout
          ? { ...prev.layout, schema: nextSchema }
          : {
              title: 'Основная планировка',
              schema: nextSchema,
              previewUrl: null,
              isPublished: false,
            },
      };
    });
  };

  const setPlanFieldMeters = (widthM: number, heightM: number) => {
    const w = Math.min(120, Math.max(2, Number.isFinite(widthM) ? widthM : 6));
    const h = Math.min(120, Math.max(2, Number.isFinite(heightM) ? heightM : 4));
    setState((prev) => {
      const prevSchema =
        prev.layout?.schema && typeof prev.layout.schema === 'object' && prev.layout.schema !== null
          ? (prev.layout.schema as Record<string, unknown>)
          : {};
      const nextSchema = {
        ...prevSchema,
        editorPlanFieldM: { widthM: w, heightM: h },
      };
      return {
        ...prev,
        layout: prev.layout
          ? { ...prev.layout, schema: nextSchema }
          : {
              title: 'Основная планировка',
              schema: nextSchema,
              previewUrl: null,
              isPublished: false,
            },
      };
    });
  };

  const handleCanvasMove = (event: React.MouseEvent<SVGSVGElement>) => {
    const svg = event.currentTarget;
    setShiftPressed(event.shiftKey);
    const raw = toCanvasPoint(svg, event.clientX, event.clientY);
    setCursorPoint(raw);

    if (drawMode !== 'DELETE') {
      setDeleteHover(null);
    }

    if (drawMode === 'DELETE') {
      if (deleteSelectActiveRef.current) {
        setEditHover(null);
        return;
      }
      const g = geomRef.current;
      const snapped = snapToGrid(raw);
      const top = pickTopTarget(
        collectPickTargets(
          snapped,
          g.walls,
          g.roomZones,
          g.tables,
          g.chairs,
          g.windows,
          PX_PER_METER,
          g.fixtures,
          g.doors,
          g.stairs,
        ),
      );
      setDeleteHover(top ? pickTargetToDeleteHover(top) : null);
      setEditHover(null);
      return;
    }

    if (drawMode === 'EDIT' && !editDragRef.current) {
      const g = geomRef.current;
      const wHit = filterWallsForEdit(g.walls, editFocus);
      const zHit = filterZonesForEdit(g.roomZones, editFocus);
      const tHit = filterTablesForEdit(g.tables, editFocus);
      const cHit = filterChairsForEdit(g.chairs, editFocus);
      const winHit = filterWindowsForEdit(g.windows, editFocus);
      const fHit = filterFixturesForEdit(g.fixtures, editFocus);
      const sHit = filterStairsForEdit(g.stairs, editFocus);
      const dHit = filterDoorsForEdit(g.doors, editFocus);
      const snapped = snapToGrid(raw);
      const stack = collectPickTargets(
        snapped,
        wHit,
        zHit,
        tHit,
        cHit,
        winHit,
        PX_PER_METER,
        fHit,
        dHit,
        sHit,
      );
      const stackKey = stack.map((t) => `${t.kind}:${t.id}`).join('|');
      if (stackKey !== editPickStackKeyRef.current) {
        editPickStackKeyRef.current = stackKey;
        setEditPickIndex(0);
      }
      setEditPickStack(stack);
      if (stack.length <= 1) {
        setEditHover(stack[0] ? pickTargetToEditHover(stack[0]) : null);
      }
    } else if (drawMode !== 'EDIT') {
      setEditHover(null);
      setEditPickStack([]);
    }
  };

  const handleCanvasMouseDown = (event: React.MouseEvent<SVGSVGElement>) => {
    if (drawMode === 'DELETE' && event.button === 0) {
      event.preventDefault();
      const svg = event.currentTarget;
      const start = toCanvasPoint(svg, event.clientX, event.clientY);
      deleteSelectActiveRef.current = true;
      setDeleteMarquee({ x1: start.x, y1: start.y, x2: start.x, y2: start.y });
      const onMove = (ev: MouseEvent) => {
        if (!svgRef.current) return;
        const cur = toCanvasPoint(svgRef.current, ev.clientX, ev.clientY);
        setDeleteMarquee({ x1: start.x, y1: start.y, x2: cur.x, y2: cur.y });
      };
      const onUp = (ev: MouseEvent) => {
        window.removeEventListener('mousemove', onMove);
        window.removeEventListener('mouseup', onUp);
        deleteSelectActiveRef.current = false;
        if (!svgRef.current) {
          setDeleteMarquee(null);
          return;
        }
        const end = toCanvasPoint(svgRef.current, ev.clientX, ev.clientY);
        const dx = Math.abs(end.x - start.x);
        const dy = Math.abs(end.y - start.y);
        setDeleteMarquee(null);
        if (dx < DELETE_MARQUEE_PX && dy < DELETE_MARQUEE_PX) {
          return;
        }
        const r = rectFromTwoPoints(start, end);
        if (r.w < 4 || r.h < 4) return;
        deleteClickSuppressRef.current = true;
        const g = geomRef.current;
        const wallHit = new Set<string>();
        for (const w of g.walls) {
          if (segmentIntersectsNormRect(w.start, w.end, r)) wallHit.add(w.id);
        }
        const zoneHit = new Set<string>();
        for (const z of g.roomZones) {
          if (z.points.length >= 3 && zoneIntersectsNormRect(z.points, r)) zoneHit.add(z.id);
        }
        const tableHit = new Set<string>();
        for (const t of g.tables) {
          if (furnitureIntersectsNormRect(t, r, PX_PER_METER)) tableHit.add(t.id);
        }
        const chairHit = new Set<string>();
        for (const c of g.chairs) {
          if (furnitureIntersectsNormRect(c, r, PX_PER_METER)) chairHit.add(c.id);
        }
        const windowHit = new Set<string>();
        for (const win of g.windows) {
          if (windowIntersectsNormRect(win, g.walls, r)) windowHit.add(win.id);
        }
        const doorHit = new Set<string>();
        for (const dr of g.doors) {
          if (doorIntersectsNormRect(dr, g.walls, r)) doorHit.add(dr.id);
        }
        const fixtureHit = new Set<string>();
        for (const fx of g.fixtures) {
          if (furnitureIntersectsNormRect(fx, r, PX_PER_METER)) fixtureHit.add(fx.id);
        }
        const stairHit = new Set<string>();
        for (const st of g.stairs) {
          if (furnitureIntersectsNormRect(st, r, PX_PER_METER)) stairHit.add(st.id);
        }
        if (
          wallHit.size === 0 &&
          zoneHit.size === 0 &&
          tableHit.size === 0 &&
          chairHit.size === 0 &&
          windowHit.size === 0 &&
          doorHit.size === 0 &&
          fixtureHit.size === 0 &&
          stairHit.size === 0
        ) {
          return;
        }
        const nextWalls = g.walls.filter((w) => !wallHit.has(w.id));
        commitLayout(
          {
            walls: nextWalls,
            roomZones: g.roomZones.filter((z) => !zoneHit.has(z.id)),
            tables: g.tables.filter((t) => !tableHit.has(t.id)),
            chairs: g.chairs.filter((c) => !chairHit.has(c.id)),
            windows: removeWindowsOnWalls(
              g.windows.filter((w) => !windowHit.has(w.id)),
              wallHit,
            ),
            doors: g.doors.filter((d) => !doorHit.has(d.id)),
            fixtures: g.fixtures.filter((f) => !fixtureHit.has(f.id)),
            stairs: g.stairs.filter((s) => !stairHit.has(s.id)),
          },
          { label: 'Удаление рамкой', kind: 'delete' },
        );
      };
      window.addEventListener('mousemove', onMove);
      window.addEventListener('mouseup', onUp);
      return;
    }
    if (drawMode !== 'EDIT') return;
    event.preventDefault();
    const svg = event.currentTarget;
    const raw = toCanvasPoint(svg, event.clientX, event.clientY);
    const g0 = geomRef.current;
    const wHit = filterWallsForEdit(g0.walls, editFocus);
    const zHit = filterZonesForEdit(g0.roomZones, editFocus);
    const tHit = filterTablesForEdit(g0.tables, editFocus);
    const cHit = filterChairsForEdit(g0.chairs, editFocus);
    const winHit = filterWindowsForEdit(g0.windows, editFocus);
    const fHit = filterFixturesForEdit(g0.fixtures, editFocus);
    const sHit = filterStairsForEdit(g0.stairs, editFocus);
    const dHit = filterDoorsForEdit(g0.doors, editFocus);
    const snapped = snapToGrid(raw);
    const stack =
      editPickStack.length > 0
        ? editPickStack
        : collectPickTargets(
            snapped,
            wHit,
            zHit,
            tHit,
            cHit,
            winHit,
            PX_PER_METER,
            fHit,
            dHit,
            sHit,
          );
    const pick =
      editSubMode === 'rotate'
        ? resolveRotatePick(stack, editPickIndex)
        : (stack[editPickIndex] ?? pickTopTarget(stack));
    if (!pick) return;

    if (pick.kind === 'window') {
      const wn = winHit.find((w) => w.id === pick.id);
      if (wn) {
        editDragRef.current = {
          kind: 'window-body',
          windowId: wn.id,
          window0: { ...wn, spans: wn.spans.map((s) => ({ ...s })) },
        };
      }
    } else if (pick.kind === 'table') {
      const th = tHit.find((t) => t.id === pick.id);
      if (th) {
        editDragRef.current = {
          kind: 'table-body',
          tableId: th.id,
          grab: { ...snapped },
          table0: { ...th },
        };
      }
    } else if (pick.kind === 'chair') {
      const ch = cHit.find((c) => c.id === pick.id);
      if (ch) {
        editDragRef.current = {
          kind: 'chair-body',
          chairId: ch.id,
          grab: { ...snapped },
          chair0: { ...ch },
        };
      }
    } else if (pick.kind === 'fixture') {
      const fx = fHit.find((f) => f.id === pick.id);
      if (fx) {
        editDragRef.current = {
          kind: 'fixture-body',
          fixtureId: fx.id,
          grab: { ...snapped },
          fixture0: { ...fx },
        };
      }
    } else if (pick.kind === 'stair') {
      const st = sHit.find((s) => s.id === pick.id);
      if (st) {
        editDragRef.current = {
          kind: 'stair-body',
          stairId: st.id,
          grab: { ...snapped },
          stair0: { ...st },
        };
      }
    } else if (pick.kind === 'wall') {
      const wall = wHit.find((w) => w.id === pick.id);
      if (wall) {
        const part = pick.wallPart || 'body';
        if (part === 'body') {
          editDragRef.current = {
            kind: 'wall-body',
            wallId: wall.id,
            grab: { ...snapped },
            wall0: { ...wall },
            weldStartRefs: collectEndpointsAt(g0.walls, wall.start),
            weldEndRefs: collectEndpointsAt(g0.walls, wall.end),
          };
        } else {
          const fixed = part === 'start' ? { ...wall.end } : { ...wall.start };
          const M0 = part === 'start' ? { ...wall.start } : { ...wall.end };
          const selfRef: WallEndpointRef = { wallId: wall.id, end: part };
          let noWeld = event.altKey;
          const pendingDetach = detachWallVertexNextRef.current;
          if (
            !noWeld &&
            pendingDetach &&
            pendingDetach.wallId === wall.id &&
            pendingDetach.end === part
          ) {
            noWeld = true;
            detachWallVertexNextRef.current = null;
          }
          const weldRefs = noWeld ? [selfRef] : collectEndpointsAt(g0.walls, M0);
          editDragRef.current = {
            kind: 'wall-end',
            wallId: wall.id,
            end: part,
            fixed,
            wall0: { ...wall },
            weldRefs,
          };
        }
      }
    } else if (pick.kind === 'zone-vertex' || pick.kind === 'zone-body') {
      const zone = zHit.find((z) => z.id === pick.id);
      if (!zone) return;
      if (pick.kind === 'zone-vertex' && pick.zoneVertexIndex != null) {
        const vi = pick.zoneVertexIndex;
        const n = zone.points.length;
        const anchor = { ...zone.points[(vi - 1 + n) % n] };
        editDragRef.current = {
          kind: 'zone-vertex',
          zoneId: zone.id,
          vertexIndex: vi,
          anchor,
          points0: zone.points.map((q) => ({ ...q })),
        };
      } else if (editSubMode === 'rotate') {
        const center = polygonCentroid(zone.points);
        editDragRef.current = {
          kind: 'zone-rotate',
          zoneId: zone.id,
          center,
          points0: zone.points.map((q) => ({ ...q })),
          startAngle: Math.atan2(snapped.y - center.y, snapped.x - center.x),
        };
      } else {
        editDragRef.current = {
          kind: 'zone-body',
          zoneId: zone.id,
          grab: { ...snapped },
          points0: zone.points.map((q) => ({ ...q })),
        };
      }
    }

    setEditLockedPick(pick);
    setEditDraggingUi(true);
    if (!editDragRef.current) return;

    const onMove = (ev: MouseEvent) => {
      const d = editDragRef.current;
      if (!d || !svgRef.current) return;
      const r = toCanvasPoint(svgRef.current, ev.clientX, ev.clientY);
      const g = geomRef.current;
      const sn = snapToGrid(r);
      const vb = svgRef.current.viewBox.baseVal;
      const clampPt = (pt: Point): Point => ({
        x: Math.min(vb.width, Math.max(0, round2(pt.x))),
        y: Math.min(vb.height, Math.max(0, round2(pt.y))),
      });

      if (d.kind === 'table-body') {
        if (editSubMode === 'rotate') {
          const deg = (Math.atan2(sn.y - d.table0.y, sn.x - d.table0.x) * 180) / Math.PI;
          const nextTables = g.tables.map((t) =>
            t.id === d.tableId ? { ...t, rotationDeg: Math.round(deg) } : t,
          );
          geomRef.current = { ...g, tables: nextTables };
          setTables(nextTables);
          return;
        }
        let dx = sn.x - d.grab.x;
        let dy = sn.y - d.grab.y;
        if (ev.shiftKey) {
          const od = orthoDelta(d.grab, sn);
          dx = od.x;
          dy = od.y;
        }
        const moved = clampPt({ x: d.table0.x + dx, y: d.table0.y + dy });
        const nextTables = g.tables.map((t) =>
          t.id === d.tableId ? { ...t, x: moved.x, y: moved.y } : t,
        );
        geomRef.current = { ...g, tables: nextTables };
        setTables(nextTables);
        return;
      }
      if (d.kind === 'zone-rotate') {
        const angle = Math.atan2(sn.y - d.center.y, sn.x - d.center.x);
        const deltaDeg = ((angle - d.startAngle) * 180) / Math.PI;
        const newPoints = rotatePointsAround(d.points0, d.center, deltaDeg);
        const nextZones = g.roomZones.map((z) =>
          z.id === d.zoneId ? { ...z, points: newPoints } : z,
        );
        geomRef.current = { ...g, roomZones: nextZones };
        setRoomZones(nextZones);
        return;
      }
      if (d.kind === 'chair-body') {
        if (editSubMode === 'rotate') {
          const deg = (Math.atan2(sn.y - d.chair0.y, sn.x - d.chair0.x) * 180) / Math.PI + 90;
          const nextChairs = g.chairs.map((c) =>
            c.id === d.chairId ? { ...c, rotationDeg: Math.round(deg) } : c,
          );
          geomRef.current = { ...g, chairs: nextChairs };
          setChairs(nextChairs);
          return;
        }
        let dx = sn.x - d.grab.x;
        let dy = sn.y - d.grab.y;
        if (ev.shiftKey) {
          const od = orthoDelta(d.grab, sn);
          dx = od.x;
          dy = od.y;
        }
        const moved = clampPt({ x: d.chair0.x + dx, y: d.chair0.y + dy });
        const nextChairs = g.chairs.map((c) =>
          c.id === d.chairId ? { ...c, x: moved.x, y: moved.y } : c,
        );
        geomRef.current = { ...g, chairs: nextChairs };
        setChairs(nextChairs);
        return;
      }
      if (d.kind === 'window-body') {
        const moved = slideWindowAlongWall(g.walls, d.window0, sn, PX_PER_METER);
        const nextWindows = g.windows.map((w) =>
          w.id === d.windowId
            ? { ...moved, id: d.windowId, name: w.name, presetId: w.presetId }
            : w,
        );
        geomRef.current = { ...g, windows: nextWindows };
        setWindows(nextWindows);
        return;
      }
      if (d.kind === 'fixture-body') {
        if (editSubMode === 'rotate') {
          const deg = (Math.atan2(sn.y - d.fixture0.y, sn.x - d.fixture0.x) * 180) / Math.PI;
          const nextFixtures = g.fixtures.map((f) =>
            f.id === d.fixtureId ? { ...f, rotationDeg: Math.round(deg) } : f,
          );
          geomRef.current = { ...g, fixtures: nextFixtures };
          setFixtures(nextFixtures);
          return;
        }
        let dx = sn.x - d.grab.x;
        let dy = sn.y - d.grab.y;
        if (ev.shiftKey) {
          const od = orthoDelta(d.grab, sn);
          dx = od.x;
          dy = od.y;
        }
        const moved = clampPt({ x: d.fixture0.x + dx, y: d.fixture0.y + dy });
        const nextFixtures = g.fixtures.map((f) =>
          f.id === d.fixtureId ? { ...f, x: moved.x, y: moved.y } : f,
        );
        geomRef.current = { ...g, fixtures: nextFixtures };
        setFixtures(nextFixtures);
        return;
      }
      if (d.kind === 'stair-body') {
        if (editSubMode === 'rotate') {
          const deg = (Math.atan2(sn.y - d.stair0.y, sn.x - d.stair0.x) * 180) / Math.PI;
          const nextStairs = g.stairs.map((s) =>
            s.id === d.stairId ? { ...s, rotationDeg: Math.round(deg) } : s,
          );
          geomRef.current = { ...g, stairs: nextStairs };
          setStairs(nextStairs);
          return;
        }
        let dx = sn.x - d.grab.x;
        let dy = sn.y - d.grab.y;
        if (ev.shiftKey) {
          const od = orthoDelta(d.grab, sn);
          dx = od.x;
          dy = od.y;
        }
        const moved = clampPt({ x: d.stair0.x + dx, y: d.stair0.y + dy });
        const nextStairs = g.stairs.map((s) =>
          s.id === d.stairId ? { ...s, x: moved.x, y: moved.y } : s,
        );
        geomRef.current = { ...g, stairs: nextStairs };
        setStairs(nextStairs);
        return;
      }

      const nodes: Point[] = [
        ...g.walls.flatMap((w) => [w.start, w.end]),
        ...g.roomZones.flatMap((z) => z.points),
      ];
      const snWeld = nearestPoint(nodes, r) ?? sn;
      const next = applyEditGeometry(
        g.walls,
        g.roomZones,
        d,
        snWeld,
        ev.shiftKey,
        vb.width,
        vb.height,
      );
      geomRef.current = { ...g, walls: next.walls, roomZones: next.roomZones };
      setWalls(next.walls);
      setRoomZones(next.roomZones);
    };
    const onUp = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      editDragRef.current = null;
      setEditDraggingUi(false);
      setEditLockedPick(null);
      const fin = geomRef.current;
      commitLayout(
        {
          walls: fin.walls,
          roomZones: fin.roomZones,
          tables: fin.tables,
          chairs: fin.chairs,
          windows: sanitizeWindows(fin.windows, fin.walls),
          fixtures: fin.fixtures,
          doors: fin.doors,
          stairs: fin.stairs,
        },
        { label: 'Корректор', kind: 'edit' },
      );
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  const handleSvgDoubleClick = (event: React.MouseEvent<SVGSVGElement>) => {
    if (drawMode !== 'EDIT' || !svgRef.current) return;
    event.preventDefault();
    const raw = toCanvasPoint(svgRef.current, event.clientX, event.clientY);
    const { walls: wL, roomZones: zL, tables: tL, chairs: cL } = geomRef.current;
    const snapped = snapToGrid(raw);
    const whAll = hitTestWall(wL, snapped);
    const zhAll = hitTestZone(zL, snapped);

    if (editFocus?.type === 'wall') {
      const keepBody = whAll?.part === 'body' && whAll.wall.id === editFocus.id;
      if (keepBody) return;
      if (whAll && (whAll.part === 'start' || whAll.part === 'end')) {
        detachWallVertexNextRef.current = { wallId: whAll.wall.id, end: whAll.part };
        return;
      }
      setEditFocus(null);
      return;
    }
    if (editFocus?.type === 'zone') {
      const keepBody = zhAll?.part === 'body' && zhAll.zone.id === editFocus.id;
      if (keepBody) return;
      setEditFocus(null);
      return;
    }
    if (editFocus?.type === 'table') {
      const th = hitTestTable(tL, snapped, PX_PER_METER);
      if (th?.id === editFocus.id) return;
      setEditFocus(null);
      return;
    }
    if (editFocus?.type === 'chair') {
      const ch = hitTestChair(cL, snapped, PX_PER_METER);
      if (ch?.id === editFocus.id) return;
      setEditFocus(null);
      return;
    }
    if (editFocus?.type === 'window') {
      const wn = hitTestWindow(geomRef.current.windows, wL, snapped);
      if (wn?.id === editFocus.id) return;
      setEditFocus(null);
      return;
    }
    if (editFocus?.type === 'door') {
      const dr = hitTestDoor(geomRef.current.doors, wL, snapped);
      if (dr?.id === editFocus.id) return;
      setEditFocus(null);
      return;
    }
    if (editFocus?.type === 'fixture') {
      const fx = hitTestFixture(geomRef.current.fixtures, snapped, PX_PER_METER);
      if (fx?.id === editFocus.id) return;
      setEditFocus(null);
      return;
    }
    if (editFocus?.type === 'stair') {
      const st = hitTestStair(geomRef.current.stairs, snapped, PX_PER_METER);
      if (st?.id === editFocus.id) return;
      setEditFocus(null);
      return;
    }

    const fxAll = hitTestFixture(geomRef.current.fixtures, snapped, PX_PER_METER);
    if (fxAll) {
      setEditFocus({ type: 'fixture', id: fxAll.id });
      return;
    }
    const chAll = hitTestChair(cL, snapped, PX_PER_METER);
    if (chAll) {
      setEditFocus({ type: 'chair', id: chAll.id });
      return;
    }
    const thAll = hitTestTable(tL, snapped, PX_PER_METER);
    if (thAll) {
      setEditFocus({ type: 'table', id: thAll.id });
      return;
    }
    const drAll = hitTestDoor(geomRef.current.doors, wL, snapped);
    if (drAll) {
      setEditFocus({ type: 'door', id: drAll.id });
      return;
    }
    const stAll = hitTestStair(geomRef.current.stairs, snapped, PX_PER_METER);
    if (stAll) {
      setEditFocus({ type: 'stair', id: stAll.id });
      return;
    }
    const wnAll = hitTestWindow(geomRef.current.windows, wL, snapped);
    if (wnAll) {
      setEditFocus({ type: 'window', id: wnAll.id });
      return;
    }

    const wHit = filterWallsForEdit(wL, editFocus);
    const zHit = filterZonesForEdit(zL, editFocus);
    const allNodes: Point[] = [
      ...wHit.flatMap((w) => [w.start, w.end]),
      ...zHit.flatMap((z) => z.points),
    ];
    const nearest = nearestPoint(allNodes, raw);
    const snappedIso = nearest ?? snapToGrid(raw);
    const wh = hitTestWall(wHit, snappedIso);
    if (wh?.part === 'body') {
      setEditFocus({ type: 'wall', id: wh.wall.id });
      return;
    }
    const zh = hitTestZone(zHit, snappedIso);
    if (zh?.part === 'body') {
      setEditFocus({ type: 'zone', id: zh.zone.id });
      return;
    }
    if (wh && (wh.part === 'start' || wh.part === 'end')) {
      detachWallVertexNextRef.current = { wallId: wh.wall.id, end: wh.part };
    }
  };

  const handleCanvasClick = (event: React.MouseEvent<SVGSVGElement>) => {
    if (drawMode === 'DELETE') {
      if (deleteClickSuppressRef.current) {
        deleteClickSuppressRef.current = false;
        return;
      }
      if (!snappedCursor) return;
      const top = pickTopTarget(
        collectPickTargets(
          snappedCursor,
          walls,
          roomZones,
          tables,
          chairs,
          windows,
          PX_PER_METER,
          fixtures,
          doors,
          stairs,
        ),
      );
      if (!top) return;
      if (top.kind === 'fixture') {
        commitLayout(
          {
            walls,
            roomZones,
            tables,
            chairs,
            windows,
            fixtures: fixtures.filter((f) => f.id !== top.id),
          },
          { label: 'Удалён объект', kind: 'delete' },
        );
      } else if (top.kind === 'chair') {
        commitLayout(
          { walls, roomZones, tables, chairs: chairs.filter((c) => c.id !== top.id), windows },
          { label: 'Удалён стул', kind: 'delete' },
        );
      } else if (top.kind === 'table') {
        commitLayout(
          { walls, roomZones, tables: tables.filter((t) => t.id !== top.id), chairs, windows },
          { label: 'Удалён стол', kind: 'delete' },
        );
      } else if (top.kind === 'door') {
        commitLayout(
          {
            walls,
            roomZones,
            tables,
            chairs,
            windows,
            doors: doors.filter((d) => d.id !== top.id),
          },
          { label: 'Удалена дверь', kind: 'delete' },
        );
      } else if (top.kind === 'stair') {
        commitLayout(
          {
            walls,
            roomZones,
            tables,
            chairs,
            windows,
            stairs: stairs.filter((s) => s.id !== top.id),
          },
          { label: 'Удалена лестница', kind: 'delete' },
        );
      } else if (top.kind === 'window') {
        commitLayout(
          {
            walls,
            roomZones,
            tables,
            chairs,
            windows: windows.filter((w) => w.id !== top.id),
          },
          { label: 'Удалено окно', kind: 'delete' },
        );
      } else if (top.kind === 'wall') {
        commitLayout(
          {
            walls: walls.filter((w) => w.id !== top.id),
            roomZones,
            tables,
            chairs,
            windows: removeWindowsOnWalls(windows, new Set([top.id])),
          },
          { label: 'Удалена стена', kind: 'delete' },
        );
      } else if (top.kind === 'zone-vertex') {
        const zone = roomZones.find((z) => z.id === top.id);
        if (!zone) return;
        if (zone.points.length <= 3) {
          commitGeometry(
            walls,
            roomZones.filter((z) => z.id !== top.id),
            { label: 'Удалена зона', kind: 'delete' },
          );
        } else {
          const newPts = zone.points.filter((_, i) => i !== top.zoneVertexIndex);
          commitGeometry(
            walls,
            roomZones.map((z) => (z.id === top.id ? { ...z, points: newPts } : z)),
            { label: 'Вершина зоны', kind: 'edit' },
          );
        }
      } else if (top.kind === 'zone-body') {
        commitGeometry(
          walls,
          roomZones.filter((z) => z.id !== top.id),
          { label: 'Удалена зона', kind: 'delete' },
        );
      }
      setDeleteHover(null);
      return;
    }
    if (drawMode === 'EDIT') return;
    if (!snappedCursor) return;
    const point = snappedCursor;

    if (drawMode === 'TABLE') {
      const presetId = tablePresetPick !== '__new__' ? tablePresetPick : newLayoutId();
      const item: PlanTable = {
        id: newLayoutId(),
        name: tableDraft.name.trim() || 'Стол',
        x: point.x,
        y: point.y,
        widthM: tableDraft.widthM,
        heightM: tableDraft.depthM,
        shape: tableShapeDraft,
        rotationDeg: 0,
        presetId,
      };
      const preset: PlacementPreset = {
        id: presetId,
        name: item.name,
        widthM: item.widthM,
        depthM: item.heightM,
      };
      persistPlacementMeta('table', tableDraft, preset);
      commitLayout(
        { walls, roomZones, tables: [...tables, item], chairs, windows },
        { label: `Стол: ${item.name}`, kind: 'draw' },
      );
      setPlaceArmed(true);
      return;
    }

    if (drawMode === 'CHAIR') {
      const presetId = chairPresetPick !== '__new__' ? chairPresetPick : newLayoutId();
      const item: PlanChair = {
        id: newLayoutId(),
        name: chairDraft.name.trim() || 'Стул',
        x: point.x,
        y: point.y,
        widthM: chairDraft.widthM,
        heightM: chairDraft.depthM,
        rotationDeg: 0,
        variant: chairVariant,
        presetId,
      };
      const preset: PlacementPreset = {
        id: presetId,
        name: item.name,
        widthM: item.widthM,
        depthM: item.heightM,
      };
      persistPlacementMeta('chair', chairDraft, preset);
      commitLayout(
        { walls, roomZones, tables, chairs: [...chairs, item], windows },
        { label: `Стул: ${item.name}`, kind: 'draw' },
      );
      setPlaceArmed(true);
      return;
    }

    if (drawMode === 'WINDOW') {
      const proposal = proposeWindowPlacement(walls, point, windowDraft.widthM, PX_PER_METER);
      if (!proposal) return;
      const presetId = windowPresetPick !== '__new__' ? windowPresetPick : newLayoutId();
      const item: PlanWindow = {
        id: newLayoutId(),
        name: windowDraft.name.trim() || 'Окно',
        widthM: proposal.widthM,
        spans: proposal.spans,
        presetId,
      };
      persistPlacementMeta('window', windowDraft, {
        id: presetId,
        name: item.name,
        widthM: item.widthM,
      });
      commitLayout(
        { walls, roomZones, tables, chairs, windows: [...windows, item] },
        { label: `Окно: ${item.name}`, kind: 'draw' },
      );
      setPlaceArmed(true);
      return;
    }

    if (drawMode === 'DOOR') {
      const proposal = proposeDoorPlacement(walls, point, doorDraft.widthM, PX_PER_METER);
      if (!proposal) return;
      const item: PlanDoor = {
        id: newLayoutId(),
        name: doorDraft.name.trim() || 'Дверь',
        widthM: proposal.widthM,
        spans: proposal.spans,
        kind: doorKind,
        swing: doorSwing,
        hingeSide: 'left',
      };
      commitLayout(
        { walls, roomZones, tables, chairs, windows, doors: [...doors, item] },
        { label: `Дверь: ${item.name}`, kind: 'draw' },
      );
      return;
    }

    if (drawMode === 'STAIR') {
      if (stairKind === 'half_room') {
        const pairId = halfStairPending?.pairId ?? newLayoutId();
        const pairRole = halfStairPending ? 'down' : 'up';
        const item: PlanStair = {
          ...stairDraft,
          id: newLayoutId(),
          x: point.x,
          y: point.y,
          kind: 'half_room',
          pairId,
          pairRole,
          widthM: stairDraft.widthM * 0.55,
        };
        commitLayout(
          { walls, roomZones, tables, chairs, windows, stairs: [...stairs, item] },
          { label: `Лестница: ${item.name}`, kind: 'draw' },
        );
        setHalfStairPending(halfStairPending ? null : { pairId });
        return;
      }
      const item: PlanStair = {
        ...stairDraft,
        id: newLayoutId(),
        x: point.x,
        y: point.y,
        kind: stairKind,
      };
      commitLayout(
        { walls, roomZones, tables, chairs, windows, stairs: [...stairs, item] },
        { label: `Лестница: ${item.name}`, kind: 'draw' },
      );
      return;
    }

    if (drawMode === 'FIXTURE') {
      const kind = interiorTool as FixtureKind;
      const item: PlanFixture = {
        ...fixtureDraft,
        id: newLayoutId(),
        x: point.x,
        y: point.y,
        kind,
        name: fixtureDraft.name.trim() || defaultFixture(kind).name,
        sofaStyle: interiorTool === 'sofa' ? sofaStyle : fixtureDraft.sofaStyle,
        skipCollision: interiorTool === 'tv_stand' || interiorTool === 'whiteboard',
      };
      commitLayout(
        { walls, roomZones, tables, chairs, windows, fixtures: [...fixtures, item] },
        { label: `${item.name}`, kind: 'draw' },
      );
      return;
    }

    if (drawMode === 'WALL') {
      if (!draftWallStart) {
        setDraftWallStart(point);
        return;
      }
      if (distance(draftWallStart, point) < 1) return;
      commitGeometry(
        [...walls, { id: newLayoutId(), start: draftWallStart, end: point }],
        roomZones,
        { label: 'Добавлена стена', kind: 'draw' },
      );
      setDraftWallStart(point);
      return;
    }
    setDraftRoomPoints((prev) => [...prev, point]);
  };

  const handleFinishWall = () => {
    if (drawMode === 'EDIT' || drawMode === 'DELETE') return;
    if (drawMode === 'WALL') {
      setDraftWallStart(null);
      return;
    }
    if (draftRoomPoints.length < 3) return;
    const zoneId = newLayoutId();
    const points = draftRoomPoints.map((p) => ({ ...p }));
    const nextZones = [...roomZones, { id: zoneId, points, roomId: null }];
    commitGeometry(walls, nextZones, { label: 'Новая зона', kind: 'draw' });
    setDraftRoomPoints([]);
    setRoomPickerZoneId(zoneId);
    setRoomPickerValue('');
  };

  const handleUndoWall = () => {
    if (drawMode === 'EDIT' || drawMode === 'DELETE') return;
    if (drawMode === 'WALL') {
      if (!walls.length) return;
      commitGeometry(walls.slice(0, -1), roomZones, {
        label: 'Отмена сегмента стены',
        kind: 'draw',
      });
      setDraftWallStart(null);
      return;
    }
    if (draftRoomPoints.length > 0) {
      setDraftRoomPoints((prev) => prev.slice(0, -1));
      return;
    }
    if (!roomZones.length) return;
    commitGeometry(walls, roomZones.slice(0, -1), {
      label: 'Отмена зоны (черновик)',
      kind: 'draw',
    });
  };

  const handleClearWalls = () => {
    if (drawMode === 'EDIT' || drawMode === 'DELETE') return;
    if (drawMode === 'WALL') {
      commitGeometry([], roomZones, { label: 'Очистка стен', kind: 'clear' });
      setDraftWallStart(null);
      return;
    }
    commitGeometry(walls, [], { label: 'Очистка зон', kind: 'clear' });
    setDraftRoomPoints([]);
  };

  const getRoomNameById = (roomId: string | null) => {
    if (!roomId) return 'Комната не назначена';
    const room = state.rooms.find((r) => r?.id === roomId);
    return room?.name || 'Комната не назначена';
  };

  const polygonCenter = (points: Point[]) => {
    const sum = points.reduce((acc, p) => ({ x: acc.x + p.x, y: acc.y + p.y }), { x: 0, y: 0 });
    return { x: sum.x / points.length, y: sum.y / points.length };
  };

  const openRoomPicker = (zoneId: string) => {
    const zone = roomZones.find((z) => z.id === zoneId);
    setRoomPickerZoneId(zoneId);
    setRoomPickerValue(zone?.roomId ?? '');
  };

  const clampCanvasZoom = (z: number) => Math.min(2.5, Math.max(0.4, round2(z)));

  const svgCursorStyle = useMemo(() => {
    if (drawMode === 'DELETE') {
      if (deleteMarquee) return 'crosshair';
      return deleteHover ? 'pointer' : 'crosshair';
    }
    if (drawMode === 'TABLE' || drawMode === 'CHAIR' || drawMode === 'WINDOW') {
      return 'crosshair';
    }
    if (drawMode !== 'EDIT') return 'crosshair';
    if (editDraggingUi) return 'grabbing';
    if (!editHover) return 'crosshair';
    if (editHover.kind === 'wall') {
      return editHover.part === 'body' ? 'grab' : 'move';
    }
    if (
      editHover.kind === 'table' ||
      editHover.kind === 'chair' ||
      editHover.kind === 'window' ||
      editHover.kind === 'fixture' ||
      editHover.kind === 'stair'
    ) {
      return 'grab';
    }
    if (editHover.kind === 'zone') {
      return editHover.part === 'body' ? 'grab' : 'move';
    }
    return 'crosshair';
  }, [drawMode, editHover, editDraggingUi, deleteHover, deleteMarquee, placeArmed]);

  const svgTextScale = useMemo(() => Math.max(0.38, canvasZoom) / CANVAS_BASE_ZOOM, [canvasZoom]);

  const occupancyDisplay = useMemo(() => {
    const occRooms = Array.isArray(occupancy?.rooms) ? occupancy.rooms : [];
    const byId = new Map<string, OccupancyRoomRow>(occRooms.map((r) => [r.roomId, r]));
    const rows = state.rooms.map((room: EditorRoomRecord, idx: number) => {
      const id = room?.id;
      const o = id ? byId.get(id) : undefined;
      const cap = Number(room?.capacity) || 0;
      const appointmentsCount = o?.appointmentsCount ?? 0;
      const occPct =
        cap > 0
          ? Math.min(100, Math.round((appointmentsCount / cap) * 100))
          : (o?.occupancyPercent ?? 0);
      const z = id ? roomZones.find((rz) => rz.roomId === id) : undefined;
      const areaM2 = z ? polygonAreaSqM(z.points) : null;
      return {
        roomId: id || `local-${idx}`,
        roomName: String(room?.name || 'Комната'),
        capacity: cap,
        appointmentsCount,
        occupancyPercent: occPct,
        areaM2,
      };
    });
    const totalCapacity = rows.reduce((s, r) => s + Math.max(0, r.capacity), 0);
    const totalAppointments = rows.reduce((s, r) => s + r.appointmentsCount, 0);
    return {
      rows,
      roomCount: rows.length,
      totalCapacity,
      totalAppointments,
    };
  }, [occupancy, state.rooms, roomZones]);

  const applyRoomPicker = (skip: boolean) => {
    if (!roomPickerZoneId) return;
    const nextZones = roomZones.map((z) =>
      z.id === roomPickerZoneId
        ? { ...z, roomId: skip || !roomPickerValue ? null : roomPickerValue }
        : z,
    );
    commitGeometry(walls, nextZones, { label: 'Комната в зоне', kind: 'picker' });
    setRoomPickerZoneId(null);
    setRoomPickerValue('');
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Планировка и комнаты</h2>

      <div className="grid gap-3 md:grid-cols-3">
        <div>
          <label className="mb-1 block text-sm font-medium">Кафе</label>
          <select
            value={cafeId}
            onChange={(e) => setCafeId(e.target.value)}
            className="w-full rounded-lg border border-[rgb(var(--tc-border))] bg-[rgb(var(--tc-bg))] px-3 py-2"
          >
            {cafes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Дата для сводки загруженности</label>
          <input
            type="date"
            value={occupancyDate}
            onChange={(e) => setOccupancyDate(e.target.value)}
            className="w-full rounded-lg border border-[rgb(var(--tc-border))] bg-[rgb(var(--tc-bg))] px-3 py-2"
          />
          <p className="mt-1 text-xs text-[rgb(var(--tc-muted))]">
            Влияет на блок «Загруженность» ниже и на данные с сервера для выбранной даты.
          </p>
        </div>
        <div className="flex flex-col justify-end">
          <span className="mb-1 block text-sm font-medium opacity-0">Сохранить</span>
          <button
            onClick={requestSave}
            disabled={saving || !cafeId}
            className="w-full rounded-lg bg-[rgb(var(--tc-accent))] px-3 py-2 text-white disabled:opacity-60"
          >
            {saving ? 'Сохранение...' : 'Сохранить планировку'}
          </button>
          <p className="mt-1 text-xs text-[rgb(var(--tc-muted))]">
            Сохраняет планировку, комнаты и разметку на сервер.
          </p>
        </div>
      </div>

      {selectedCafe && (
        <p className="text-sm text-[rgb(var(--tc-muted))]">Активное кафе: {selectedCafe.name}</p>
      )}
      {loading && <p className="text-sm text-[rgb(var(--tc-muted))]">Загрузка...</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}

      {(occupancy != null || (state.rooms?.length ?? 0) > 0) && (
        <div className="rounded-xl border border-[rgb(var(--tc-border))] p-3">
          <h3 className="mb-2 font-semibold">Загруженность (на дату)</h3>
          <p className="mb-2 text-sm text-[rgb(var(--tc-muted))]">
            Комнат в расчёте: {occupancyDisplay.roomCount}. Суммарная вместимость:{' '}
            {occupancyDisplay.totalCapacity} чел. Записей на дату:{' '}
            {occupancyDisplay.totalAppointments}.
          </p>
          {occupancyDisplay.rows.length > 0 && (
            <ul className="space-y-1 text-sm">
              {occupancyDisplay.rows.map((row, idx) => (
                <li
                  key={`${row.roomId}-${idx}`}
                  className="flex flex-wrap gap-x-3 gap-y-0.5 border-t border-[rgb(var(--tc-border))]/60 pt-1 first:border-t-0 first:pt-0"
                >
                  <span className="font-medium">{row.roomName}</span>
                  <span className="text-[rgb(var(--tc-muted))]">до {row.capacity} чел.</span>
                  <span className="text-[rgb(var(--tc-muted))]">
                    площадь: {row.areaM2 != null ? `${row.areaM2.toFixed(1)} m²` : '—'}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <div
        className={
          layoutFullscreen
            ? 'fixed inset-0 z-[200] flex min-h-0 flex-col overflow-hidden bg-[rgb(var(--tc-bg))] p-2 md:p-3'
            : 'rounded-xl border border-[rgb(var(--tc-border))] p-3'
        }
      >
        <div className="mb-3 flex shrink-0 flex-wrap items-center justify-between gap-2">
          <h3 className="font-semibold">
            Визуальная разметка
            {layoutFullscreen && (
              <span className="ml-2 text-xs font-normal text-[rgb(var(--tc-muted))]">
                полный экран · Esc
              </span>
            )}
          </h3>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleFinishWall}
              disabled={
                drawMode === 'EDIT' ||
                drawMode === 'DELETE' ||
                drawMode === 'TABLE' ||
                drawMode === 'CHAIR' ||
                drawMode === 'WINDOW'
              }
              className="rounded-lg border border-[rgb(var(--tc-border))] px-2 py-1 text-sm disabled:pointer-events-none disabled:opacity-40"
            >
              {drawMode === 'WALL'
                ? 'Завершить стену'
                : drawMode === 'ROOM'
                  ? 'Завершить зону'
                  : '—'}
            </button>
            <button
              type="button"
              onClick={applyGeometryUndo}
              disabled={undoAvailable === 0}
              title="Отмена изменения геометрии (Ctrl+Z)"
              className="rounded-lg border border-[rgb(var(--tc-border))] px-2 py-1 text-sm disabled:pointer-events-none disabled:opacity-40"
            >
              Назад
            </button>
            <div className="relative" ref={historyMenuRef}>
              <button
                type="button"
                onClick={() => setHistoryMenuOpen((o) => !o)}
                className="rounded-lg border border-[rgb(var(--tc-border))] bg-[rgb(var(--tc-bg))] px-2 py-1 text-sm"
              >
                Шаг чертежа ▾
              </button>
              {historyMenuOpen && (
                <div className="absolute left-0 top-full z-50 mt-1 max-h-[min(70vh,420px)] min-w-[260px] overflow-y-auto rounded-lg border border-[rgb(var(--tc-border))] bg-[rgb(var(--tc-bg))] py-1 text-left text-sm shadow-lg">
                  <div className="px-2 py-1 text-xs font-semibold uppercase tracking-wide text-[rgb(var(--tc-muted))]">
                    История геометрии
                  </div>
                  {geometryHistoryRef.current.map((entry, idx) => {
                    const cur = historyCursorRef.current;
                    const textCls =
                      idx < cur
                        ? 'text-gray-400'
                        : idx > cur
                          ? 'text-slate-500'
                          : 'font-medium text-[rgb(var(--tc-fg))]';
                    return (
                      <button
                        key={`${historyUiTick}-hist-${idx}`}
                        type="button"
                        onClick={() => jumpToHistoryIndex(idx)}
                        className={`flex w-full items-center gap-2 border-l-2 px-2 py-1.5 text-left ${historyKindRowClass(entry.kind)} ${textCls}`}
                      >
                        <span className="min-w-[1.25rem] text-[10px] text-[rgb(var(--tc-muted))]">
                          {idx + 1}.
                        </span>
                        <span className="flex-1">{entry.label}</span>
                      </button>
                    );
                  })}
                  <div className="mt-1 border-t border-[rgb(var(--tc-border))] px-2 py-1 text-xs font-semibold uppercase tracking-wide text-[rgb(var(--tc-muted))]">
                    Действия в режиме рисования
                  </div>
                  {drawMode === 'WALL' && walls.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        handleUndoWall();
                        setHistoryMenuOpen(false);
                      }}
                      className="w-full px-2 py-1.5 text-left text-sm hover:bg-[rgb(var(--tc-border))]/25"
                    >
                      Удалить последний сегмент стены
                    </button>
                  )}
                  {drawMode === 'ROOM' && draftRoomPoints.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        setDraftRoomPoints((prev) => prev.slice(0, -1));
                        setHistoryMenuOpen(false);
                      }}
                      className="w-full px-2 py-1.5 text-left text-sm hover:bg-[rgb(var(--tc-border))]/25"
                    >
                      Убрать последнюю вершину черновика
                    </button>
                  )}
                  {drawMode === 'ROOM' && draftRoomPoints.length === 0 && roomZones.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        handleUndoWall();
                        setHistoryMenuOpen(false);
                      }}
                      className="w-full px-2 py-1.5 text-left text-sm hover:bg-[rgb(var(--tc-border))]/25"
                    >
                      Удалить последнюю зону
                    </button>
                  )}
                  {drawMode === 'ROOM' &&
                    draftRoomPoints.length === 0 &&
                    roomZones.length === 0 && (
                      <p className="px-2 py-1 text-xs text-[rgb(var(--tc-muted))]">
                        Нет шагов черновика
                      </p>
                    )}
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={applyGeometryRedo}
              disabled={redoAvailable === 0}
              title="Повтор (Ctrl+Y)"
              className="rounded-lg border border-[rgb(var(--tc-border))] px-2 py-1 text-sm disabled:pointer-events-none disabled:opacity-40"
            >
              Повтор
            </button>
            <button
              onClick={handleClearWalls}
              disabled={drawMode === 'EDIT' || drawMode === 'DELETE'}
              className="rounded-lg border border-red-300 px-2 py-1 text-sm text-red-700 disabled:pointer-events-none disabled:opacity-40"
            >
              {drawMode === 'WALL' ? 'Очистить стены' : drawMode === 'ROOM' ? 'Очистить зоны' : '—'}
            </button>
          </div>
        </div>

        {planGroup === 'interior' && drawMode === 'TABLE' && (
          <LayoutPlacementPanel
            draft={tableDraft}
            onDraftChange={(patch) => setTableDraft((d) => ({ ...d, ...patch }))}
            placeArmed={placeArmed}
            onArmPlace={() => setPlaceArmed(true)}
            presets={tablePresetOptions}
            presetPick={tablePresetPick}
            onPresetPick={(v) => {
              setTablePresetPick(v);
              if (v === '__new__') {
                setTableDraft(
                  readPlacementDefaults(
                    state.layout?.schema,
                    'lastTableDefaults',
                    DEFAULT_TABLE_DRAFT,
                  ),
                );
                return;
              }
              const p = tablePresetOptions.find((x) => x.id === v);
              if (p) setTableDraft({ name: p.name, widthM: p.widthM, depthM: p.depthM });
            }}
            presetLabel="Тип стола"
            hidePlaceButton
            hint="Размеры и форма применяются к следующему клику на план."
          />
        )}
        {planGroup === 'interior' && drawMode === 'TABLE' && (
          <div className="mb-2 flex flex-wrap items-end gap-3 text-sm">
            <div>
              <label className="mb-0.5 block text-xs text-[rgb(var(--tc-muted))]">
                Форма стола
              </label>
              <select
                value={tableShapeDraft}
                onChange={(e) => setTableShapeDraft(e.target.value as TableShape)}
                className="rounded-lg border border-[rgb(var(--tc-border))] bg-[rgb(var(--tc-bg))] px-2 py-1"
              >
                <option value="rect">Прямоугольник</option>
                <option value="rounded">Скруглённые углы</option>
                <option value="oval">Овал</option>
              </select>
            </div>
          </div>
        )}
        {planGroup === 'interior' && drawMode === 'CHAIR' && (
          <LayoutPlacementPanel
            draft={chairDraft}
            onDraftChange={(patch) => setChairDraft((d) => ({ ...d, ...patch }))}
            placeArmed={placeArmed}
            onArmPlace={() => setPlaceArmed(true)}
            hidePlaceButton
            presets={chairPresetOptions}
            presetPick={chairPresetPick}
            onPresetPick={(v) => {
              setChairPresetPick(v);
              if (v === '__new__') {
                setChairDraft(
                  readPlacementDefaults(
                    state.layout?.schema,
                    'lastChairDefaults',
                    DEFAULT_CHAIR_DRAFT,
                  ),
                );
                return;
              }
              const p = chairPresetOptions.find((x) => x.id === v);
              if (p) setChairDraft({ name: p.name, widthM: p.widthM, depthM: p.depthM });
            }}
            presetLabel="Тип стула"
          />
        )}
        {planGroup === 'structure' && drawMode === 'WINDOW' && (
          <LayoutPlacementPanel
            draft={windowDraft}
            onDraftChange={(patch) => setWindowDraft((d) => ({ ...d, ...patch }))}
            placeArmed={placeArmed}
            onArmPlace={() => setPlaceArmed(true)}
            presets={windowPresetOptions.map((p) => ({ ...p, depthM: 0 }))}
            presetPick={windowPresetPick}
            onPresetPick={(v) => {
              setWindowPresetPick(v);
              if (v === '__new__') {
                const d = readWindowDefaults(state.layout?.schema);
                setWindowDraft({ name: d.name, widthM: d.widthM, depthM: 0 });
                return;
              }
              const p = windowPresetOptions.find((x) => x.id === v);
              if (p) setWindowDraft({ name: p.name, widthM: p.widthM, depthM: 0 });
            }}
            showDepth={false}
            widthLabel="Ширина проёма (м)"
            presetLabel="Тип окна"
            hidePlaceButton
            hint="Кликните по стене — окно примагнитится к стене."
          />
        )}

        <div className={layoutFullscreen ? 'flex min-h-0 flex-1 flex-col gap-2' : ''}>
          <div
            className={
              layoutFullscreen
                ? 'shrink-0 space-y-2 rounded-lg border border-[rgb(var(--tc-border))]/70 bg-[rgb(var(--tc-bg))]/90 p-3'
                : ''
            }
          >
            <div className="mb-3 flex flex-wrap items-end gap-3 text-sm">
              <div>
                <label className="mb-0.5 block text-xs text-[rgb(var(--tc-muted))]">
                  Поле плана, ширина (м)
                </label>
                <input
                  type="number"
                  min={2}
                  max={120}
                  step={0.5}
                  value={planFieldM.widthM}
                  onChange={(e) =>
                    setPlanFieldMeters(Number(e.target.value) || 2, planFieldM.heightM)
                  }
                  className="w-28 rounded-lg border border-[rgb(var(--tc-border))] bg-[rgb(var(--tc-bg))] px-2 py-1"
                />
              </div>
              <div>
                <label className="mb-0.5 block text-xs text-[rgb(var(--tc-muted))]">
                  Высота (м)
                </label>
                <input
                  type="number"
                  min={2}
                  max={120}
                  step={0.5}
                  value={planFieldM.heightM}
                  onChange={(e) =>
                    setPlanFieldMeters(planFieldM.widthM, Number(e.target.value) || 2)
                  }
                  className="w-28 rounded-lg border border-[rgb(var(--tc-border))] bg-[rgb(var(--tc-bg))] px-2 py-1"
                />
              </div>
              <p className="max-w-xl flex-1 text-xs text-[rgb(var(--tc-muted))]">
                Минимальный размер рабочего поля в метрах (20 px сетки = 0,1 м). Увеличьте поле,
                чтобы расставить комнаты с запасом; при большом масштабе полоса прокрутки ведёт по
                всей области.
              </p>
              <div className="flex w-full flex-wrap items-end gap-2">
                <label className="cursor-pointer rounded-lg border border-[rgb(var(--tc-border))] bg-[rgb(var(--tc-bg))] px-3 py-1.5 text-xs font-semibold hover:bg-[rgb(var(--tc-border))]/30">
                  {planBackground ? 'Заменить фон' : 'Загрузить фон (PNG)'}
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      e.target.value = '';
                      if (!file) return;
                      if (file.size > 4 * 1024 * 1024) {
                        setError('Фон: файл больше 4 МБ');
                        return;
                      }
                      const reader = new FileReader();
                      reader.onload = () => {
                        const dataUrl = String(reader.result || '');
                        if (!dataUrl.startsWith('data:image/')) return;
                        const wPx = planFieldM.widthM * PX_PER_METER;
                        const hPx = planFieldM.heightM * PX_PER_METER;
                        setPlanBackground({
                          dataUrl,
                          x: wPx / 2,
                          y: hPx / 2,
                          widthM: planFieldM.widthM,
                          heightM: planFieldM.heightM,
                          opacity: 0.92,
                        });
                      };
                      reader.readAsDataURL(file);
                    }}
                  />
                </label>
                {planBackground && (
                  <>
                    <button
                      type="button"
                      onClick={() => setPlanBackground(null)}
                      className="rounded-lg border border-red-300 px-3 py-1.5 text-xs text-red-700 hover:bg-red-50"
                    >
                      Убрать фон
                    </button>
                    <div>
                      <label className="mb-0.5 block text-xs text-[rgb(var(--tc-muted))]">
                        Прозрачность
                      </label>
                      <input
                        type="range"
                        min={0.2}
                        max={1}
                        step={0.05}
                        value={planBackground.opacity ?? 1}
                        onChange={(e) =>
                          setPlanBackground({
                            ...planBackground,
                            opacity: Number(e.target.value),
                          })
                        }
                        className="w-28"
                      />
                    </div>
                  </>
                )}
              </div>
            </div>

            <p className="mb-2 text-sm text-[rgb(var(--tc-muted))]">
              {drawMode === 'WALL'
                ? 'Клик: начало/конец сегмента стены. Без Shift — любой угол (30°, 45°, 60° и т.д.). Зажатый Shift — только горизонталь или вертикаль от точки старта.'
                : drawMode === 'ROOM'
                  ? 'Клик: вершины контура комнаты. Пунктир — замыкание к первой точке. «Завершить зону» — только по поставленным точкам (позиция мыши не добавляется). Shift — ортогональ от последней вершины.'
                  : drawMode === 'DELETE'
                    ? 'Удаление: клик — стена, зона, стол, стул или окно. Рамкой (зажать ЛКМ) — всё пересекающееся. Удаление стены удаляет окна на ней.'
                    : drawMode === 'TABLE'
                      ? 'Задайте размеры и форму стола, затем кликните на план — стол поставится сразу. Параметры сохраняются для следующих столов.'
                      : drawMode === 'CHAIR'
                        ? 'Выберите тип стула или задайте новый, затем кликните на план. Параметры последнего стула подставляются автоматически.'
                        : drawMode === 'WINDOW'
                          ? 'Задайте ширину проёма и кликните по стене. Окно двигается вдоль стены; у угла — угловое. Удаление стены удаляет её окна.'
                          : `Корректор: узлы стен в радиусе ${WELD_EPS}px склеиваются — перетаскивание угла двигает все совпавшие концы. При перекрытии объектов верхний моргает 4 с, затем следующий. Двойной клик — изоляция объекта и панель свойств ниже. Esc — выйти. Масштаб: Ctrl + колёсико или панель на плане.`}
            </p>

            {activeEditFocus && (
              <LayoutEditInspector
                focus={activeEditFocus}
                editSubMode={editSubMode}
                rooms={state.rooms}
                zoneRoomId={activeEditZone?.roomId ?? null}
                zoneAreaM2={activeEditZone ? polygonAreaSqM(activeEditZone.points) : null}
                table={
                  activeEditFocus.type === 'table'
                    ? tables.find((t) => t.id === activeEditFocus.id)
                    : undefined
                }
                chair={
                  activeEditFocus.type === 'chair'
                    ? chairs.find((c) => c.id === activeEditFocus.id)
                    : undefined
                }
                window={
                  activeEditFocus.type === 'window'
                    ? windows.find((w) => w.id === activeEditFocus.id)
                    : undefined
                }
                fixture={
                  activeEditFocus.type === 'fixture'
                    ? fixtures.find((f) => f.id === activeEditFocus.id)
                    : undefined
                }
                door={
                  activeEditFocus.type === 'door'
                    ? doors.find((d) => d.id === activeEditFocus.id)
                    : undefined
                }
                stair={
                  activeEditFocus.type === 'stair'
                    ? stairs.find((s) => s.id === activeEditFocus.id)
                    : undefined
                }
                wallThicknessPx={wallThicknessPx}
                onPatchZoneRoom={(roomId) => {
                  if (activeEditFocus.type === 'zone') patchZoneRoomId(activeEditFocus.id, roomId);
                }}
                onPatchRoom={updateRoomById}
                onPatchTable={(patch) => {
                  if (activeEditFocus.type === 'table') patchTableById(activeEditFocus.id, patch);
                }}
                onPatchChair={(patch) => {
                  if (activeEditFocus.type === 'chair') patchChairById(activeEditFocus.id, patch);
                }}
                onPatchWindow={(patch) => {
                  if (activeEditFocus.type === 'window') patchWindowById(activeEditFocus.id, patch);
                }}
                onPatchFixture={(patch) => {
                  if (activeEditFocus.type === 'fixture')
                    patchFixtureById(activeEditFocus.id, patch);
                }}
                onPatchDoor={(patch) => {
                  if (activeEditFocus.type === 'door') patchDoorById(activeEditFocus.id, patch);
                }}
                onPatchStair={(patch) => {
                  if (activeEditFocus.type === 'stair') patchStairById(activeEditFocus.id, patch);
                }}
                onPatchWallThickness={(px) => setWallThicknessPx(Math.min(24, Math.max(6, px)))}
              />
            )}

            {planGroup === 'interior' && interiorTool === 'chair' && (
              <div className="mb-2 flex flex-wrap items-end gap-3 text-sm">
                <div>
                  <label className="mb-0.5 block text-xs text-[rgb(var(--tc-muted))]">
                    Тип стула
                  </label>
                  <select
                    value={chairVariant}
                    onChange={(e) => setChairVariant(e.target.value as ChairVariant)}
                    className="rounded-lg border border-[rgb(var(--tc-border))] bg-[rgb(var(--tc-bg))] px-2 py-1"
                  >
                    {CHAIR_VARIANTS.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {planGroup === 'structure' && structureTool === 'door' && drawMode === 'DOOR' && (
              <div className="mb-2 flex flex-wrap items-end gap-3 text-sm">
                <div>
                  <label className="mb-0.5 block text-xs text-[rgb(var(--tc-muted))]">
                    Название
                  </label>
                  <input
                    type="text"
                    value={doorDraft.name}
                    onChange={(e) => setDoorDraft((d) => ({ ...d, name: e.target.value }))}
                    placeholder="Дверь"
                    className="w-36 rounded-lg border border-[rgb(var(--tc-border))] bg-[rgb(var(--tc-bg))] px-2 py-1"
                  />
                </div>
                <div>
                  <label className="mb-0.5 block text-xs text-[rgb(var(--tc-muted))]">
                    Ширина (м)
                  </label>
                  <input
                    type="number"
                    min={0.6}
                    max={2.5}
                    step={0.05}
                    value={doorDraft.widthM}
                    onChange={(e) =>
                      setDoorDraft((d) => ({ ...d, widthM: Number(e.target.value) || 0.9 }))
                    }
                    className="w-24 rounded-lg border border-[rgb(var(--tc-border))] bg-[rgb(var(--tc-bg))] px-2 py-1"
                  />
                </div>
                <div>
                  <label className="mb-0.5 block text-xs text-[rgb(var(--tc-muted))]">
                    Тип двери
                  </label>
                  <select
                    value={doorKind}
                    onChange={(e) => setDoorKind(e.target.value as DoorKind)}
                    className="rounded-lg border border-[rgb(var(--tc-border))] bg-[rgb(var(--tc-bg))] px-2 py-1"
                  >
                    {DOOR_KINDS.map((k) => (
                      <option key={k.id} value={k.id}>
                        {k.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-0.5 block text-xs text-[rgb(var(--tc-muted))]">
                    Открывание
                  </label>
                  <select
                    value={doorSwing}
                    onChange={(e) => setDoorSwing(e.target.value as DoorSwing)}
                    className="rounded-lg border border-[rgb(var(--tc-border))] bg-[rgb(var(--tc-bg))] px-2 py-1"
                  >
                    {DOOR_SWINGS.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {planGroup === 'structure' && structureTool === 'stair' && drawMode === 'STAIR' && (
              <div className="mb-2 flex flex-wrap items-end gap-3 text-sm">
                <div>
                  <label className="mb-0.5 block text-xs text-[rgb(var(--tc-muted))]">
                    Название
                  </label>
                  <input
                    type="text"
                    value={stairDraft.name}
                    onChange={(e) => setStairDraft((s) => ({ ...s, name: e.target.value }))}
                    className="w-36 rounded-lg border border-[rgb(var(--tc-border))] bg-[rgb(var(--tc-bg))] px-2 py-1"
                  />
                </div>
                {stairKind === 'half_room' && halfStairPending && (
                  <p className="text-xs text-amber-700 dark:text-amber-300">
                    Кликните второй сегмент лестницы (вниз) — пунктиром соединится с первым.
                  </p>
                )}
                <div>
                  <label className="mb-0.5 block text-xs text-[rgb(var(--tc-muted))]">
                    Тип лестницы
                  </label>
                  <select
                    value={stairKind}
                    onChange={(e) => {
                      const k = e.target.value as StairKind;
                      setStairKind(k);
                      setStairDraft(defaultStair(k));
                    }}
                    className="rounded-lg border border-[rgb(var(--tc-border))] bg-[rgb(var(--tc-bg))] px-2 py-1"
                  >
                    {STAIR_KINDS.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {planGroup === 'interior' && drawMode === 'FIXTURE' && (
              <div className="mb-2 flex flex-wrap items-end gap-3 text-sm">
                <div>
                  <label className="mb-0.5 block text-xs text-[rgb(var(--tc-muted))]">
                    Название на плане
                  </label>
                  <input
                    type="text"
                    value={fixtureDraft.name}
                    onChange={(e) => setFixtureDraft((f) => ({ ...f, name: e.target.value }))}
                    placeholder={defaultFixture(interiorTool as FixtureKind).name}
                    className="w-44 rounded-lg border border-[rgb(var(--tc-border))] bg-[rgb(var(--tc-bg))] px-2 py-1"
                  />
                </div>
                {interiorTool === 'sofa' && (
                  <div>
                    <label className="mb-0.5 block text-xs text-[rgb(var(--tc-muted))]">
                      Стиль дивана
                    </label>
                    <select
                      value={sofaStyle}
                      onChange={(e) => setSofaStyle(e.target.value as SofaStyle)}
                      className="rounded-lg border border-[rgb(var(--tc-border))] bg-[rgb(var(--tc-bg))] px-2 py-1"
                    >
                      {SOFA_STYLES.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.label}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            )}

            {planGroup === 'structure' && drawMode === 'WALL' && (
              <div className="mb-2 flex flex-wrap items-end gap-3 text-sm">
                <div>
                  <label className="mb-0.5 block text-xs text-[rgb(var(--tc-muted))]">
                    Толщина стены (px)
                  </label>
                  <input
                    type="number"
                    min={6}
                    max={24}
                    step={1}
                    value={wallThicknessPx}
                    onChange={(e) =>
                      setWallThicknessPx(
                        Math.min(
                          24,
                          Math.max(6, Number(e.target.value) || DEFAULT_WALL_THICKNESS_PX),
                        ),
                      )
                    }
                    className="w-24 rounded-lg border border-[rgb(var(--tc-border))] bg-[rgb(var(--tc-bg))] px-2 py-1"
                  />
                </div>
              </div>
            )}
          </div>

          <div className={layoutFullscreen ? 'flex min-h-0 flex-1 gap-2' : ''}>
            <div
              className={
                layoutFullscreen
                  ? 'flex w-40 shrink-0 flex-col gap-2 overflow-y-auto rounded-lg border border-[rgb(var(--tc-border))] bg-[rgb(var(--tc-bg))]/95 p-2 shadow-sm'
                  : 'mb-3 flex flex-wrap items-center gap-2'
              }
            >
              <span className="text-xs font-medium text-[rgb(var(--tc-muted))]">Группа:</span>
              <button
                type="button"
                onClick={() => applyStructureTool(structureTool)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
                  planGroup === 'structure'
                    ? 'bg-blue-600 text-white'
                    : 'border border-[rgb(var(--tc-border))] hover:bg-[rgb(var(--tc-border))]/30'
                }`}
              >
                Конструкция
              </button>
              <button
                type="button"
                onClick={() => applyInteriorTool(interiorTool)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
                  planGroup === 'interior'
                    ? 'bg-amber-800 text-white'
                    : 'border border-[rgb(var(--tc-border))] hover:bg-[rgb(var(--tc-border))]/30'
                }`}
              >
                Интерьер
              </button>

              {planGroup === 'structure' && (
                <div
                  className={
                    layoutFullscreen ? 'flex flex-col gap-1' : 'mb-2 flex w-full flex-wrap gap-1'
                  }
                >
                  {STRUCTURE_TOOLS.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => applyStructureTool(t.id)}
                      className={`rounded-md px-2.5 py-1 text-xs font-semibold ${
                        structureTool === t.id && drawMode !== 'EDIT' && drawMode !== 'DELETE'
                          ? 'bg-blue-600 text-white'
                          : 'border border-[rgb(var(--tc-border))] hover:bg-[rgb(var(--tc-border))]/30'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              )}

              {planGroup === 'interior' && (
                <div
                  className={
                    layoutFullscreen ? 'flex flex-col gap-1' : 'mb-2 flex w-full flex-wrap gap-1'
                  }
                >
                  {INTERIOR_TOOLS.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => applyInteriorTool(t.id)}
                      className={`rounded-md px-2.5 py-1 text-xs font-semibold ${
                        interiorTool === t.id && drawMode !== 'EDIT' && drawMode !== 'DELETE'
                          ? 'bg-amber-800 text-white'
                          : 'border border-[rgb(var(--tc-border))] hover:bg-[rgb(var(--tc-border))]/30'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className={layoutFullscreen ? 'flex min-h-0 min-w-0 flex-1 flex-col' : ''}>
              <div
                className={`relative overflow-hidden rounded-xl border border-[rgb(var(--tc-border))] ${layoutFullscreen ? 'flex min-h-0 min-w-0 flex-1 flex-col' : 'max-h-[80vh]'}`}
              >
                <div className="pointer-events-none absolute inset-x-0 top-0 z-30 flex items-start justify-between gap-2 p-2">
                  <div className="pointer-events-auto shrink-0">
                    <div className="pointer-events-auto flex flex-col gap-1 rounded-lg border border-[rgb(var(--tc-border))] bg-[rgb(var(--tc-bg))]/95 p-1 shadow-sm backdrop-blur-sm">
                      {editFocus && drawMode === 'EDIT' && (
                        <button
                          type="button"
                          title="Показать весь план"
                          onClick={() => setEditFocus(null)}
                          className="rounded-md border border-amber-500/60 bg-amber-500/15 px-2 py-1 text-[10px] font-semibold text-amber-800 dark:text-amber-200"
                        >
                          Весь план
                        </button>
                      )}
                      {drawMode === 'EDIT' && (
                        <>
                          <button
                            type="button"
                            title="Перемещение"
                            onClick={() => setEditSubMode('move')}
                            className={`rounded-md px-2 py-1 text-[10px] font-semibold ${
                              editSubMode === 'move'
                                ? 'bg-amber-600 text-white'
                                : 'hover:bg-[rgb(var(--tc-border))]/30'
                            }`}
                          >
                            ↔
                          </button>
                          <button
                            type="button"
                            title="Поворот (стол, стул, зона, интерьер, лестница)"
                            onClick={() => setEditSubMode('rotate')}
                            className={`rounded-md px-2 py-1 text-[10px] font-semibold ${
                              editSubMode === 'rotate'
                                ? 'bg-amber-600 text-white'
                                : 'hover:bg-[rgb(var(--tc-border))]/30'
                            }`}
                          >
                            ↻
                          </button>
                        </>
                      )}
                      <button
                        type="button"
                        title="Корректор: перемещение стен и зон"
                        onClick={() => {
                          setDrawMode('EDIT');
                          setDraftWallStart(null);
                          setDraftRoomPoints([]);
                          setEditHover(null);
                          setDeleteHover(null);
                        }}
                        className={`rounded-md px-2.5 py-1.5 text-xs font-semibold ${
                          drawMode === 'EDIT'
                            ? 'bg-amber-600 text-white'
                            : 'bg-[rgb(var(--tc-bg))] text-[rgb(var(--tc-fg))] hover:bg-[rgb(var(--tc-border))]/40'
                        }`}
                      >
                        ✎
                      </button>
                      <button
                        type="button"
                        title="Удаление стены или зоны"
                        onClick={() => {
                          setDrawMode('DELETE');
                          setDraftWallStart(null);
                          setDraftRoomPoints([]);
                          setEditHover(null);
                          setEditFocus(null);
                        }}
                        className={`rounded-md px-2.5 py-1.5 text-xs font-semibold ${
                          drawMode === 'DELETE'
                            ? 'bg-red-600 text-white'
                            : 'bg-[rgb(var(--tc-bg))] text-[rgb(var(--tc-fg))] hover:bg-[rgb(var(--tc-border))]/40'
                        }`}
                      >
                        🗑
                      </button>
                    </div>
                  </div>
                  <div className="pointer-events-auto shrink-0">
                    <div className="pointer-events-auto flex items-center gap-1 rounded-lg border border-[rgb(var(--tc-border))] bg-[rgb(var(--tc-bg))]/95 px-1 py-0.5 text-xs text-[rgb(var(--tc-fg))] shadow-sm backdrop-blur-sm">
                      <button
                        type="button"
                        className="rounded px-1.5 py-0.5 hover:bg-[rgb(var(--tc-border))]/30"
                        onClick={() => setCanvasZoom((z) => clampCanvasZoom(z - 0.1))}
                      >
                        −
                      </button>
                      <span className="min-w-[3.25rem] text-center text-[13px] font-medium tabular-nums text-[rgb(var(--tc-fg))]">
                        {Math.round((canvasZoom / CANVAS_BASE_ZOOM) * 100)}%
                      </span>
                      <button
                        type="button"
                        className="rounded px-1.5 py-0.5 hover:bg-[rgb(var(--tc-border))]/30"
                        onClick={() => setCanvasZoom((z) => clampCanvasZoom(z + 0.1))}
                      >
                        +
                      </button>
                      <button
                        type="button"
                        className="rounded px-1.5 py-0.5 hover:bg-[rgb(var(--tc-border))]/30"
                        title="Сброс масштаба"
                        onClick={() => setCanvasZoom(CANVAS_BASE_ZOOM)}
                      >
                        ⟲
                      </button>
                      <button
                        type="button"
                        className="rounded px-1.5 py-0.5 hover:bg-[rgb(var(--tc-border))]/30"
                        title={
                          layoutFullscreen
                            ? 'Выйти из полноэкранного режима (Esc)'
                            : 'Полноэкранный режим'
                        }
                        onClick={() => setLayoutFullscreen((v) => !v)}
                      >
                        {layoutFullscreen ? '⤢' : '⛶'}
                      </button>
                    </div>
                  </div>
                </div>
                <div
                  ref={canvasScrollRef}
                  className={
                    layoutFullscreen
                      ? 'min-h-0 flex-1 overflow-auto p-2 pt-14'
                      : 'max-h-[80vh] overflow-auto p-2 pt-14'
                  }
                >
                  <div
                    className="relative min-w-full rounded-xl bg-[#fafafa] shadow-sm ring-1 ring-black/5 dark:ring-white/10"
                    style={{
                      width: contentWidth * canvasZoom,
                      minHeight: contentHeight * canvasZoom,
                    }}
                  >
                    <svg
                      ref={svgRef}
                      viewBox={`0 0 ${contentWidth} ${contentHeight}`}
                      preserveAspectRatio="none"
                      width={contentWidth}
                      height={contentHeight}
                      className="block h-full w-full min-h-[400px]"
                      style={{ cursor: svgCursorStyle }}
                      onMouseMove={handleCanvasMove}
                      onMouseDown={handleCanvasMouseDown}
                      onDoubleClick={handleSvgDoubleClick}
                      onClick={handleCanvasClick}
                    >
                      <defs>
                        <pattern
                          id="layout-grid"
                          width={GRID_STEP}
                          height={GRID_STEP}
                          patternUnits="userSpaceOnUse"
                        >
                          <path
                            d={`M ${GRID_STEP} 0 L 0 0 0 ${GRID_STEP}`}
                            fill="none"
                            stroke="#eef2f7"
                            strokeWidth="1"
                          />
                        </pattern>
                        <pattern
                          id="wall-hatch"
                          width={8}
                          height={8}
                          patternUnits="userSpaceOnUse"
                          patternTransform="rotate(45)"
                        >
                          <line x1={0} y1={0} x2={0} y2={8} stroke="#9ca3af" strokeWidth={1} />
                        </pattern>
                        <pattern id="stair-half" width={8} height={8} patternUnits="userSpaceOnUse">
                          <rect width={4} height={8} fill="#e5e7eb" />
                          <rect x={4} width={4} height={8} fill="#f8fafc" />
                        </pattern>
                      </defs>
                      <rect
                        x="0"
                        y="0"
                        width={contentWidth}
                        height={contentHeight}
                        fill="#fafafa"
                      />
                      <rect
                        x="0"
                        y="0"
                        width={contentWidth}
                        height={contentHeight}
                        fill="url(#layout-grid)"
                      />
                      {planBackground &&
                        (() => {
                          const bw = planBackground.widthM * PX_PER_METER;
                          const bh = planBackground.heightM * PX_PER_METER;
                          return (
                            <image
                              href={planBackground.dataUrl}
                              x={planBackground.x - bw / 2}
                              y={planBackground.y - bh / 2}
                              width={bw}
                              height={bh}
                              opacity={planBackground.opacity ?? 1}
                              preserveAspectRatio="xMidYMid meet"
                            />
                          );
                        })()}
                      {deleteMarquee &&
                        drawMode === 'DELETE' &&
                        (() => {
                          const mr = rectFromTwoPoints(
                            { x: deleteMarquee.x1, y: deleteMarquee.y1 },
                            { x: deleteMarquee.x2, y: deleteMarquee.y2 },
                          );
                          return (
                            <rect
                              x={mr.x}
                              y={mr.y}
                              width={mr.w}
                              height={mr.h}
                              fill="rgba(220,38,38,0.1)"
                              stroke="#dc2626"
                              strokeWidth={2}
                              strokeDasharray="7 5"
                              pointerEvents="none"
                            />
                          );
                        })()}

                      {(() => {
                        const jointCircles = collectWallJointCircles(
                          walls,
                          wallThicknessPx,
                          WELD_EPS,
                        );
                        const endCaps = collectWallEndCaps(walls, wallThicknessPx, WELD_EPS);
                        const capFill = (del: boolean, active: boolean) =>
                          del ? 'rgba(220,38,38,0.35)' : 'url(#wall-hatch)';
                        const capStroke = (del: boolean, active: boolean) =>
                          del ? '#dc2626' : active ? '#ea580c' : '#1f2937';
                        return (
                          <>
                            {walls.map((wall) => {
                              const d = editDragRef.current;
                              const wallActive =
                                (editHover?.kind === 'wall' && editHover.id === wall.id) ||
                                (d &&
                                  (d.kind === 'wall-body' || d.kind === 'wall-end') &&
                                  d.wallId === wall.id);
                              const dimW =
                                drawMode === 'EDIT' &&
                                (editFocus?.type === 'zone' ||
                                  (editFocus?.type === 'wall' && editFocus.id !== wall.id))
                                  ? 0.28
                                  : 1;
                              const delFlash =
                                drawMode === 'DELETE' &&
                                deleteHover?.kind === 'wall' &&
                                deleteHover.id === wall.id &&
                                deleteBlinkOn;
                              const thick = delFlash
                                ? 12
                                : wallActive
                                  ? wallThicknessPx + 2
                                  : wallThicknessPx;
                              const trimmed = trimWallSegment(wall, thick, wallJointsMap, WELD_EPS);
                              const band = wallBandPoints(trimmed, thick);
                              return (
                                <g key={wall.id} style={{ opacity: dimW }}>
                                  <polygon
                                    points={band.map((p) => `${p.x},${p.y}`).join(' ')}
                                    fill={capFill(delFlash, Boolean(wallActive))}
                                    stroke={capStroke(delFlash, Boolean(wallActive))}
                                    strokeWidth={delFlash ? 2 : 1.2}
                                    strokeLinejoin="round"
                                  />
                                  <circle
                                    cx={wall.start.x}
                                    cy={wall.start.y}
                                    r={
                                      wallActive &&
                                      editHover?.kind === 'wall' &&
                                      editHover.part === 'start'
                                        ? 6
                                        : 4.5
                                    }
                                    fill={wallActive ? '#c2410c' : '#1d4ed8'}
                                  />
                                  <circle
                                    cx={wall.end.x}
                                    cy={wall.end.y}
                                    r={
                                      wallActive &&
                                      editHover?.kind === 'wall' &&
                                      editHover.part === 'end'
                                        ? 6
                                        : 4.5
                                    }
                                    fill={wallActive ? '#c2410c' : '#1d4ed8'}
                                  />
                                </g>
                              );
                            })}
                            {jointCircles.map((c, i) => (
                              <circle
                                key={`wj-${i}`}
                                cx={c.x}
                                cy={c.y}
                                r={c.r}
                                fill="url(#wall-hatch)"
                                stroke="#1f2937"
                                strokeWidth={1.2}
                              />
                            ))}
                            {endCaps.map((c, i) => (
                              <circle
                                key={`wc-${i}`}
                                cx={c.x}
                                cy={c.y}
                                r={c.r}
                                fill="url(#wall-hatch)"
                                stroke="#1f2937"
                                strokeWidth={1.2}
                              />
                            ))}
                          </>
                        );
                      })()}

                      {walls.map((wall) => {
                        const lenM = distance(wall.start, wall.end) * METERS_PER_PX;
                        const mid = {
                          x: (wall.start.x + wall.end.x) / 2,
                          y: (wall.start.y + wall.end.y) / 2,
                        };
                        const dx = wall.end.x - wall.start.x;
                        const dy = wall.end.y - wall.start.y;
                        const L = Math.hypot(dx, dy) || 1;
                        const ox = (-dy / L) * 14 * svgTextScale;
                        const oy = (dx / L) * 14 * svgTextScale;
                        return (
                          <text
                            key={`wlen-${wall.id}`}
                            x={mid.x + ox}
                            y={mid.y + oy + 3 * svgTextScale}
                            fontSize={11 * svgTextScale}
                            fill="#4b5563"
                            textAnchor="middle"
                            pointerEvents="none"
                          >
                            {lenM.toFixed(2)} m
                          </text>
                        );
                      })}

                      {windows.map((win) => {
                        const active = editHover?.kind === 'window' && editHover.id === win.id;
                        const delFlash =
                          drawMode === 'DELETE' &&
                          deleteHover?.kind === 'window' &&
                          deleteHover.id === win.id &&
                          deleteBlinkOn;
                        const dimW =
                          drawMode === 'EDIT' &&
                          editFocus &&
                          (editFocus.type === 'wall' ||
                            editFocus.type === 'zone' ||
                            editFocus.type === 'table' ||
                            editFocus.type === 'chair' ||
                            (editFocus.type === 'window' && editFocus.id !== win.id));
                        const parts = windowDrawParts(win, walls, wallThicknessPx);
                        return (
                          <g key={win.id} style={{ opacity: dimW ? 0.28 : 1 }} pointerEvents="none">
                            {parts.map((part, pi) => (
                              <g key={`${win.id}-${pi}`}>
                                <path d={windowWallCutPath(part)} fill="#fafafa" stroke="none" />
                                <path
                                  d={windowOpeningPath(part)}
                                  fill={
                                    delFlash
                                      ? 'rgba(220,38,38,0.45)'
                                      : active
                                        ? 'rgba(241,245,249,0.95)'
                                        : '#f1f5f9'
                                  }
                                  stroke={delFlash ? '#dc2626' : active ? '#ea580c' : '#374151'}
                                  strokeWidth={delFlash ? 2 : 1.4}
                                />
                              </g>
                            ))}
                          </g>
                        );
                      })}

                      {doors.map((door) => {
                        const parts = doorDrawParts(door, walls, wallThicknessPx);
                        return (
                          <g key={door.id} pointerEvents="none">
                            {parts.map((part, pi) => (
                              <g key={`${door.id}-${pi}`}>
                                <path d={doorWallCutPath(part)} fill="#fafafa" stroke="none" />
                                <DoorSymbol part={part} />
                              </g>
                            ))}
                          </g>
                        );
                      })}

                      {roomZones.map((zone) => {
                        const center = polygonCenter(zone.points);
                        const d = editDragRef.current;
                        const zoneActive =
                          (editHover?.kind === 'zone' && editHover.id === zone.id) ||
                          (d &&
                            (d.kind === 'zone-body' || d.kind === 'zone-vertex') &&
                            d.zoneId === zone.id);
                        const dimZ =
                          drawMode === 'EDIT' &&
                          (editFocus?.type === 'wall' ||
                            (editFocus?.type === 'zone' && editFocus.id !== zone.id))
                            ? 0.28
                            : 1;
                        const stackFlash =
                          drawMode === 'EDIT' &&
                          isStackTargetActive(editPickStack, editPickIndex, editStackBlinkOn, {
                            kind: 'zone-body',
                            id: zone.id,
                            priority: 60,
                          });
                        const delZoneBody = Boolean(
                          (drawMode === 'DELETE' &&
                            deleteHover?.kind === 'zone' &&
                            deleteHover.id === zone.id &&
                            deleteHover.part === 'body' &&
                            deleteBlinkOn) ||
                          stackFlash,
                        );
                        const zoneAreaM2 = polygonAreaSqM(zone.points);
                        const zlw = 156 * svgTextScale;
                        const zlh = 44 * svgTextScale;
                        const rStatus = roomStatusForZone(state.rooms, zone.roomId);
                        const zp = zonePolygonStyle(
                          zone.roomId,
                          rStatus,
                          Boolean(zoneActive),
                          delZoneBody,
                        );
                        return (
                          <g key={zone.id} style={{ opacity: dimZ }}>
                            <polygon
                              points={zone.points.map((p) => `${p.x},${p.y}`).join(' ')}
                              fill={zp.fill}
                              stroke={zp.stroke}
                              strokeWidth={delZoneBody ? 4 : zoneActive ? 3.5 : 2.5}
                              pointerEvents="none"
                            />
                            {(drawMode === 'EDIT' || drawMode === 'DELETE') &&
                              zone.points.map((p, vi) => {
                                const vHi =
                                  editHover?.kind === 'zone' &&
                                  editHover.id === zone.id &&
                                  editHover.part === 'vertex' &&
                                  editHover.vertexIndex === vi;
                                const delV =
                                  drawMode === 'DELETE' &&
                                  deleteHover?.kind === 'zone' &&
                                  deleteHover.id === zone.id &&
                                  deleteHover.part === 'vertex' &&
                                  deleteHover.vertexIndex === vi &&
                                  deleteBlinkOn;
                                return (
                                  <circle
                                    key={`${zone.id}-v-${vi}`}
                                    cx={p.x}
                                    cy={p.y}
                                    r={delV ? 9 : vHi ? 7 : 4}
                                    fill={
                                      delV ? '#fecaca' : vHi ? '#ea580c' : 'rgba(37,99,235,0.5)'
                                    }
                                    stroke={delV ? '#dc2626' : '#1d4ed8'}
                                    strokeWidth={delV ? 2 : 1}
                                    pointerEvents="none"
                                  />
                                );
                              })}
                            <g pointerEvents="none">
                              <rect
                                x={center.x - zlw / 2}
                                y={center.y - zlh / 2 + 2}
                                width={zlw}
                                height={zlh}
                                rx={7 * svgTextScale}
                                fill="white"
                                stroke="#93c5fd"
                                strokeWidth="1"
                              />
                              <text
                                x={center.x}
                                y={center.y - 6 * svgTextScale}
                                textAnchor="middle"
                                fontSize={12 * svgTextScale}
                                fill="#1e3a8a"
                              >
                                {getRoomNameById(zone.roomId)}
                              </text>
                              <text
                                x={center.x}
                                y={center.y + 10 * svgTextScale}
                                textAnchor="middle"
                                fontSize={11 * svgTextScale}
                                fill="#64748b"
                              >
                                {zoneAreaM2 != null ? `${zoneAreaM2.toFixed(1)} m²` : '—'}
                              </text>
                            </g>
                            <g
                              pointerEvents="all"
                              cursor={drawMode === 'EDIT' ? 'inherit' : 'pointer'}
                              onClick={(e) => {
                                e.stopPropagation();
                                if (drawMode === 'EDIT' || drawMode === 'DELETE') return;
                                openRoomPicker(zone.id);
                              }}
                            >
                              <circle
                                cx={center.x + 82}
                                cy={center.y}
                                r="10"
                                fill="#dbeafe"
                                stroke="#60a5fa"
                                strokeWidth="1"
                              />
                              <text
                                x={center.x + 82}
                                y={center.y + 4}
                                textAnchor="middle"
                                fontSize="11"
                                fill="#1d4ed8"
                                pointerEvents="none"
                              >
                                ✎
                              </text>
                            </g>
                          </g>
                        );
                      })}

                      {tables.map((table) => {
                        const b = furnitureBoundsPx(table, PX_PER_METER);
                        const active = editHover?.kind === 'table' && editHover.id === table.id;
                        const stackFlash =
                          drawMode === 'EDIT' &&
                          isStackTargetActive(editPickStack, editPickIndex, editStackBlinkOn, {
                            kind: 'table',
                            id: table.id,
                            priority: 20,
                          });
                        const delFlash =
                          (drawMode === 'DELETE' &&
                            deleteHover?.kind === 'table' &&
                            deleteHover.id === table.id &&
                            deleteBlinkOn) ||
                          stackFlash;
                        const conflict = saveGeometryIssues?.tableIds.has(table.id);
                        const dimF =
                          drawMode === 'EDIT' &&
                          editFocus &&
                          (editFocus.type === 'wall' ||
                            editFocus.type === 'zone' ||
                            (editFocus.type === 'table' && editFocus.id !== table.id) ||
                            editFocus.type === 'chair');
                        const fill =
                          delFlash || conflict
                            ? 'rgba(220,38,38,0.35)'
                            : active
                              ? 'rgba(234,88,12,0.2)'
                              : 'rgba(255,255,255,0.95)';
                        const stroke =
                          delFlash || conflict ? '#dc2626' : active ? '#ea580c' : '#374151';
                        const shape = table.shape || 'rect';
                        const tf = furnitureTransform(table);
                        return (
                          <g
                            key={table.id}
                            style={{ opacity: dimF ? 0.28 : 1 }}
                            pointerEvents="none"
                            transform={tf}
                          >
                            {shape === 'oval' ? (
                              <ellipse
                                cx={table.x}
                                cy={table.y}
                                rx={b.w / 2}
                                ry={b.h / 2}
                                fill={fill}
                                stroke={stroke}
                                strokeWidth={delFlash || conflict ? 2.5 : 1.5}
                              />
                            ) : (
                              <rect
                                x={b.x}
                                y={b.y}
                                width={b.w}
                                height={b.h}
                                rx={shape === 'rounded' ? Math.min(b.w, b.h) * 0.18 : 2}
                                fill={fill}
                                stroke={stroke}
                                strokeWidth={delFlash || conflict ? 2.5 : 1.5}
                              />
                            )}
                            <text
                              x={table.x}
                              y={table.y}
                              textAnchor="middle"
                              dominantBaseline="middle"
                              fontSize={9 * svgTextScale}
                              fill="#374151"
                            >
                              {table.name}
                            </text>
                          </g>
                        );
                      })}

                      {chairs.map((chair) => {
                        const b = furnitureBoundsPx(chair, PX_PER_METER);
                        const active = editHover?.kind === 'chair' && editHover.id === chair.id;
                        const stackFlash =
                          drawMode === 'EDIT' &&
                          isStackTargetActive(editPickStack, editPickIndex, editStackBlinkOn, {
                            kind: 'chair',
                            id: chair.id,
                            priority: 10,
                          });
                        const delFlash =
                          (drawMode === 'DELETE' &&
                            deleteHover?.kind === 'chair' &&
                            deleteHover.id === chair.id &&
                            deleteBlinkOn) ||
                          stackFlash;
                        const conflict = saveGeometryIssues?.chairIds.has(chair.id);
                        const dimF =
                          drawMode === 'EDIT' &&
                          editFocus &&
                          (editFocus.type === 'wall' ||
                            editFocus.type === 'zone' ||
                            editFocus.type === 'table' ||
                            (editFocus.type === 'chair' && editFocus.id !== chair.id));
                        return (
                          <g
                            key={chair.id}
                            style={{ opacity: dimF ? 0.28 : 1 }}
                            pointerEvents="none"
                          >
                            <ChairShape
                              chair={chair}
                              pxPerMeter={PX_PER_METER}
                              active={active}
                              delFlash={delFlash}
                              conflict={conflict}
                            />
                            <text
                              x={b.x + b.w / 2}
                              y={b.y + b.h * 0.62}
                              textAnchor="middle"
                              fontSize={9 * svgTextScale}
                              fill="#44403c"
                            >
                              {chair.name}
                            </text>
                          </g>
                        );
                      })}

                      {fixtures.map((fx) => {
                        const active = editHover?.kind === 'fixture' && editHover.id === fx.id;
                        const stackFlash =
                          drawMode === 'EDIT' &&
                          isStackTargetActive(editPickStack, editPickIndex, editStackBlinkOn, {
                            kind: 'fixture',
                            id: fx.id,
                            priority: 8,
                          });
                        const delFlash =
                          (drawMode === 'DELETE' &&
                            deleteHover?.kind === 'fixture' &&
                            deleteHover.id === fx.id &&
                            deleteBlinkOn) ||
                          stackFlash;
                        const dimF =
                          drawMode === 'EDIT' &&
                          editFocus?.type === 'fixture' &&
                          editFocus.id !== fx.id;
                        return (
                          <g key={fx.id} style={{ opacity: dimF ? 0.28 : 1 }} pointerEvents="none">
                            <FixtureShape
                              f={fx}
                              pxPerMeter={PX_PER_METER}
                              active={active}
                              delFlash={delFlash}
                            />
                            <text
                              x={fx.x}
                              y={fx.y}
                              textAnchor="middle"
                              fontSize={8 * svgTextScale}
                              fill="#374151"
                            >
                              {fx.name}
                            </text>
                          </g>
                        );
                      })}

                      {stairs.map((st) => {
                        const b = furnitureBoundsPx(st, PX_PER_METER);
                        const partner = st.pairId
                          ? stairs.find((o) => o.id !== st.id && o.pairId === st.pairId)
                          : undefined;
                        const active = editHover?.kind === 'stair' && editHover.id === st.id;
                        const stackFlash =
                          drawMode === 'EDIT' &&
                          isStackTargetActive(editPickStack, editPickIndex, editStackBlinkOn, {
                            kind: 'stair',
                            id: st.id,
                            priority: 28,
                          });
                        const delFlash =
                          (drawMode === 'DELETE' &&
                            deleteHover?.kind === 'stair' &&
                            deleteHover.id === st.id &&
                            deleteBlinkOn) ||
                          stackFlash;
                        const dimF =
                          drawMode === 'EDIT' &&
                          editFocus?.type === 'stair' &&
                          editFocus.id !== st.id;
                        return (
                          <g key={st.id} style={{ opacity: dimF ? 0.28 : 1 }} pointerEvents="none">
                            <StairShape
                              st={st}
                              pxPerMeter={PX_PER_METER}
                              active={active}
                              delFlash={delFlash}
                              partner={partner}
                            />
                            <text
                              x={st.x}
                              y={b.y - 4 * svgTextScale}
                              textAnchor="middle"
                              fontSize={9 * svgTextScale}
                              fill="#374151"
                            >
                              {st.name}
                            </text>
                          </g>
                        );
                      })}

                      {(drawMode === 'TABLE' || drawMode === 'CHAIR') &&
                        snappedCursor &&
                        (() => {
                          const draft = drawMode === 'TABLE' ? tableDraft : chairDraft;
                          const ghost = {
                            x: snappedCursor.x,
                            y: snappedCursor.y,
                            widthM: draft.widthM,
                            heightM: draft.depthM,
                          };
                          const b = furnitureBoundsPx(ghost, PX_PER_METER);
                          if (drawMode === 'TABLE') {
                            const shape = tableShapeDraft;
                            if (shape === 'oval') {
                              return (
                                <ellipse
                                  cx={ghost.x}
                                  cy={ghost.y}
                                  rx={b.w / 2}
                                  ry={b.h / 2}
                                  fill="rgba(255,255,255,0.9)"
                                  stroke="#374151"
                                  strokeWidth={1.5}
                                  strokeDasharray="6 4"
                                  pointerEvents="none"
                                />
                              );
                            }
                            return (
                              <rect
                                x={b.x}
                                y={b.y}
                                width={b.w}
                                height={b.h}
                                rx={shape === 'rounded' ? Math.min(b.w, b.h) * 0.18 : 2}
                                fill="rgba(255,255,255,0.9)"
                                stroke="#374151"
                                strokeWidth={1.5}
                                strokeDasharray="6 4"
                                pointerEvents="none"
                              />
                            );
                          }
                          return (
                            <rect
                              x={b.x}
                              y={b.y}
                              width={b.w}
                              height={b.h}
                              rx={6}
                              fill="rgba(87,83,78,0.12)"
                              stroke="#57534e"
                              strokeWidth={2}
                              strokeDasharray="6 4"
                              pointerEvents="none"
                            />
                          );
                        })()}

                      {drawMode === 'WINDOW' &&
                        snappedCursor &&
                        (() => {
                          const proposal = proposeWindowPlacement(
                            walls,
                            snappedCursor,
                            windowDraft.widthM,
                            PX_PER_METER,
                          );
                          if (!proposal) return null;
                          const ghostWin: PlanWindow = {
                            id: '__ghost__',
                            name: '',
                            widthM: proposal.widthM,
                            spans: proposal.spans,
                          };
                          return windowDrawParts(ghostWin, walls, wallThicknessPx).map(
                            (part, pi) => (
                              <g key={`ghost-w-${pi}`} pointerEvents="none">
                                <path
                                  d={windowWallCutPath(part)}
                                  fill="rgba(250,250,250,0.85)"
                                  stroke="none"
                                />
                                <path
                                  d={windowOpeningPath(part)}
                                  fill="rgba(209,213,219,0.4)"
                                  stroke="#6b7280"
                                  strokeWidth={1.5}
                                  strokeDasharray="5 4"
                                />
                              </g>
                            ),
                          );
                        })()}

                      {drawMode === 'DOOR' &&
                        snappedCursor &&
                        (() => {
                          const proposal = proposeDoorPlacement(
                            walls,
                            snappedCursor,
                            doorDraft.widthM,
                            PX_PER_METER,
                          );
                          if (!proposal) return null;
                          const ghostDoor: PlanDoor = {
                            id: '__ghost__',
                            name: '',
                            widthM: proposal.widthM,
                            spans: proposal.spans,
                            kind: doorKind,
                            swing: doorSwing,
                            hingeSide: 'left',
                          };
                          return doorDrawParts(ghostDoor, walls, wallThicknessPx).map(
                            (part, pi) => (
                              <g key={`ghost-d-${pi}`} pointerEvents="none" opacity={0.85}>
                                <path
                                  d={doorWallCutPath(part)}
                                  fill="rgba(250,250,250,0.9)"
                                  stroke="none"
                                />
                                <DoorSymbol part={part} />
                              </g>
                            ),
                          );
                        })()}

                      {drawMode === 'STAIR' &&
                        snappedCursor &&
                        (() => {
                          const ghost: PlanStair = {
                            ...stairDraft,
                            x: snappedCursor.x,
                            y: snappedCursor.y,
                            kind: stairKind,
                            pairRole:
                              stairKind === 'half_room'
                                ? halfStairPending
                                  ? 'down'
                                  : 'up'
                                : undefined,
                          };
                          return (
                            <g opacity={0.8} pointerEvents="none">
                              <StairShape st={ghost} pxPerMeter={PX_PER_METER} />
                            </g>
                          );
                        })()}

                      {drawMode === 'FIXTURE' &&
                        snappedCursor &&
                        (() => {
                          const ghost: PlanFixture = {
                            ...fixtureDraft,
                            x: snappedCursor.x,
                            y: snappedCursor.y,
                            kind: interiorTool as FixtureKind,
                            sofaStyle: interiorTool === 'sofa' ? sofaStyle : fixtureDraft.sofaStyle,
                          };
                          const b = furnitureBoundsPx(ghost, PX_PER_METER);
                          return (
                            <g pointerEvents="none" opacity={0.75}>
                              <FixtureShape f={ghost} pxPerMeter={PX_PER_METER} />
                              <rect
                                x={b.x}
                                y={b.y}
                                width={b.w}
                                height={b.h}
                                fill="none"
                                stroke="#6b7280"
                                strokeWidth={1.5}
                                strokeDasharray="6 4"
                              />
                            </g>
                          );
                        })()}

                      {drawMode === 'ROOM' && draftRoomPoints.length > 1 && (
                        <polyline
                          points={draftRoomPoints.map((p) => `${p.x},${p.y}`).join(' ')}
                          fill="none"
                          stroke="#2563eb"
                          strokeWidth="3"
                        />
                      )}

                      {drawMode === 'ROOM' &&
                        draftRoomPoints.map((p, idx) => (
                          <circle
                            key={`draft-room-point-${idx}`}
                            cx={p.x}
                            cy={p.y}
                            r="4.5"
                            fill="#0284c7"
                          />
                        ))}

                      {drawMode === 'ROOM' && draftRoomPoints.length > 0 && snappedCursor && (
                        <line
                          x1={draftRoomPoints[draftRoomPoints.length - 1].x}
                          y1={draftRoomPoints[draftRoomPoints.length - 1].y}
                          x2={snappedCursor.x}
                          y2={snappedCursor.y}
                          stroke="#0891b2"
                          strokeDasharray="8 6"
                          strokeWidth="2.5"
                        />
                      )}

                      {drawMode === 'ROOM' && draftRoomPoints.length > 1 && snappedCursor && (
                        <line
                          x1={draftRoomPoints[0].x}
                          y1={draftRoomPoints[0].y}
                          x2={snappedCursor.x}
                          y2={snappedCursor.y}
                          stroke="#0ea5e9"
                          strokeDasharray="4 5"
                          strokeWidth="2"
                        />
                      )}

                      {drawMode === 'WALL' && draftWallStart && snappedCursor && (
                        <line
                          x1={draftWallStart.x}
                          y1={draftWallStart.y}
                          x2={snappedCursor.x}
                          y2={snappedCursor.y}
                          stroke="#2563eb"
                          strokeDasharray="8 6"
                          strokeWidth="4"
                          strokeLinecap="round"
                        />
                      )}

                      {drawMode === 'WALL' && draftWallStart && (
                        <circle cx={draftWallStart.x} cy={draftWallStart.y} r="6" fill="#dc2626" />
                      )}
                      {snappedCursor &&
                        drawMode !== 'EDIT' &&
                        drawMode !== 'DELETE' &&
                        drawMode !== 'TABLE' &&
                        drawMode !== 'CHAIR' &&
                        drawMode !== 'WINDOW' && (
                          <circle cx={snappedCursor.x} cy={snappedCursor.y} r="4" fill="#16a34a" />
                        )}
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-2 grid gap-2 text-sm text-[rgb(var(--tc-muted))] md:grid-cols-4">
            <div>Сегментов стен: {walls.length}</div>
            <div>Контуров комнат: {roomZones.length}</div>
            <div>Столов: {tables.length}</div>
            <div>Стульев: {chairs.length}</div>
            <div>Окон: {windows.length}</div>
            <div>Дверей: {doors.length}</div>
            <div>Объектов: {fixtures.length}</div>
            <div>Лестниц: {stairs.length}</div>
            <div className="md:col-span-4">
              Активная точка:{' '}
              {snappedCursor
                ? `${Math.round(snappedCursor.x)}:${Math.round(snappedCursor.y)}`
                : 'нет'}
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-[rgb(var(--tc-border))] p-3">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="font-semibold">Комнаты</h3>
          <button
            onClick={() =>
              setState((prev) => ({
                ...prev,
                rooms: [
                  ...prev.rooms,
                  {
                    id: newLayoutId(),
                    name: `Новая комната ${prev.rooms.length + 1}`,
                    capacity: 1,
                    status: 'ACTIVE',
                  },
                ],
              }))
            }
            className="rounded-lg border border-[rgb(var(--tc-border))] px-2 py-1 text-sm"
          >
            + Добавить комнату
          </button>
        </div>
        <div className="space-y-2">
          {state.rooms.map((room, idx) => {
            const linkedZones = room.id ? roomZonesUsingRoom(room.id) : [];
            const onPlan = linkedZones.length > 0;
            return (
              <div
                key={room.id || idx}
                className="rounded-lg border border-[rgb(var(--tc-border))] p-2"
              >
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                  <span className="text-sm font-semibold">{room.name || `Комната ${idx + 1}`}</span>
                  <button
                    type="button"
                    disabled={onPlan}
                    title={
                      onPlan
                        ? 'Комната назначена на плане — сначала снимите привязку в зоне'
                        : 'Удалить комнату из списка'
                    }
                    onClick={() => deleteRoom(idx)}
                    className={`rounded-lg border px-2.5 py-1 text-xs font-semibold ${
                      onPlan
                        ? 'cursor-not-allowed border-[rgb(var(--tc-border))] text-[rgb(var(--tc-muted))] opacity-50'
                        : 'border-red-300 text-red-700 hover:bg-red-50'
                    }`}
                  >
                    Удалить
                  </button>
                </div>
                {onPlan && (
                  <p className="mb-2 text-xs text-amber-800 dark:text-amber-200">
                    На плане: {linkedZones.length} {linkedZones.length === 1 ? 'зона' : 'зоны'} с
                    этой комнатой. Удаление недоступно, пока комната привязана к контуру.
                  </p>
                )}
                <div className="grid gap-3 md:grid-cols-3">
                  <div>
                    <label className="mb-0.5 block text-xs text-[rgb(var(--tc-muted))]">
                      Название
                    </label>
                    <input
                      value={room.name || ''}
                      onChange={(e) => updateRoom(idx, { name: e.target.value })}
                      placeholder="Например, Зал А"
                      className="w-full rounded-lg border border-[rgb(var(--tc-border))] bg-[rgb(var(--tc-bg))] px-2 py-1"
                    />
                  </div>
                  <div>
                    <label className="mb-0.5 block text-xs text-[rgb(var(--tc-muted))]">
                      Вместимость (чел.)
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={room.capacity || 0}
                      onChange={(e) => updateRoom(idx, { capacity: Number(e.target.value) || 0 })}
                      className="w-full rounded-lg border border-[rgb(var(--tc-border))] bg-[rgb(var(--tc-bg))] px-2 py-1"
                    />
                  </div>
                  <div>
                    <label className="mb-0.5 block text-xs text-[rgb(var(--tc-muted))]">
                      Статус комнаты
                    </label>
                    <select
                      value={room.status || 'ACTIVE'}
                      onChange={(e) => updateRoom(idx, { status: e.target.value })}
                      className="w-full rounded-lg border border-[rgb(var(--tc-border))] bg-[rgb(var(--tc-bg))] px-2 py-1"
                    >
                      <option value="ACTIVE">Активна (в бронировании)</option>
                      <option value="INACTIVE">Неактивна</option>
                      <option value="MAINTENANCE">На обслуживании</option>
                    </select>
                  </div>
                </div>
                <div className="mt-2">
                  <label className="mb-0.5 block text-xs text-[rgb(var(--tc-muted))]">
                    Описание
                  </label>
                  <textarea
                    value={room.description || ''}
                    onChange={(e) => updateRoom(idx, { description: e.target.value })}
                    placeholder="Кратко для гостей и админки"
                    className="w-full rounded-lg border border-[rgb(var(--tc-border))] bg-[rgb(var(--tc-bg))] px-2 py-1"
                    rows={2}
                  />
                </div>
                {(() => {
                  const billing = parseRoomBilling(room.metadata);
                  const patchBilling = (p: Partial<ReturnType<typeof parseRoomBilling>>) =>
                    updateRoom(idx, { metadata: patchRoomBilling(room.metadata, p) });
                  return (
                    <div className="mt-3 grid gap-3 border-t border-[rgb(var(--tc-border))]/60 pt-3 md:grid-cols-2">
                      <p className="md:col-span-2 text-xs font-semibold text-[rgb(var(--tc-muted))]">
                        Тарификация аренды (почасовая и/или поминутная)
                      </p>
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={billing.hourlyEnabled}
                          onChange={(e) => patchBilling({ hourlyEnabled: e.target.checked })}
                        />
                        Почасовая
                      </label>
                      <div>
                        <label className="mb-0.5 block text-xs text-[rgb(var(--tc-muted))]">
                          <CurrencyUnitLabel unit="час" />
                        </label>
                        <input
                          type="number"
                          min={0}
                          step={10}
                          disabled={!billing.hourlyEnabled}
                          value={billing.hourlyRateRub}
                          onChange={(e) =>
                            patchBilling({ hourlyRateRub: Number(e.target.value) || 0 })
                          }
                          className="w-full rounded-lg border border-[rgb(var(--tc-border))] bg-[rgb(var(--tc-bg))] px-2 py-1 disabled:opacity-40"
                        />
                      </div>
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={billing.minuteEnabled}
                          onChange={(e) => patchBilling({ minuteEnabled: e.target.checked })}
                        />
                        Поминутная
                      </label>
                      <div>
                        <label className="mb-0.5 block text-xs text-[rgb(var(--tc-muted))]">
                          <CurrencyUnitLabel unit="мин" />
                        </label>
                        <input
                          type="number"
                          min={0}
                          step={0.5}
                          disabled={!billing.minuteEnabled}
                          value={billing.minuteRateRub}
                          onChange={(e) =>
                            patchBilling({ minuteRateRub: Number(e.target.value) || 0 })
                          }
                          className="w-full rounded-lg border border-[rgb(var(--tc-border))] bg-[rgb(var(--tc-bg))] px-2 py-1 disabled:opacity-40"
                        />
                      </div>
                      <p className="md:col-span-2 text-xs text-[rgb(var(--tc-muted))]">
                        Почасовая: округление вверх до целого часа. Поминутная: цена × минуты.
                        {billingModesAvailable(billing).length === 0 && (
                          <span className="text-red-600"> Включите хотя бы один тариф.</span>
                        )}
                      </p>
                    </div>
                  );
                })()}
              </div>
            );
          })}
        </div>
      </div>

      {roomPickerZoneId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-xl border border-[rgb(var(--tc-border))] bg-[rgb(var(--tc-bg))] p-4 text-[rgb(var(--tc-fg))] shadow-lg">
            <h3 className="mb-2 text-lg font-semibold">Назначение комнаты</h3>
            <p className="mb-3 text-sm text-[rgb(var(--tc-muted))]">
              Выберите комнату для выделенной зоны или пропустите.
            </p>
            <select
              value={roomPickerValue}
              onChange={(e) => setRoomPickerValue(e.target.value)}
              className="mb-4 w-full rounded-lg border border-[rgb(var(--tc-border))] bg-[rgb(var(--tc-bg))] px-3 py-2 text-[rgb(var(--tc-fg))] outline-none ring-[rgb(var(--tc-accent))] focus:ring-2"
            >
              <option value="" className="bg-[rgb(var(--tc-bg))] text-[rgb(var(--tc-fg))]">
                Комната не назначена
              </option>
              {state.rooms.map((room) => (
                <option
                  key={room.id}
                  value={room.id}
                  className="bg-[rgb(var(--tc-bg))] text-[rgb(var(--tc-fg))]"
                >
                  {room.name || `Комната ${room.id}`}
                </option>
              ))}
            </select>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => applyRoomPicker(true)}
                className="rounded-lg border border-[rgb(var(--tc-border))] bg-[rgb(var(--tc-bg))] px-3 py-2 text-sm text-[rgb(var(--tc-fg))]"
              >
                Пропустить
              </button>
              <button
                onClick={() => applyRoomPicker(false)}
                className="rounded-lg bg-[rgb(var(--tc-accent))] px-3 py-2 text-sm text-white"
              >
                Применить
              </button>
            </div>
          </div>
        </div>
      )}

      {saveGeometryIssues &&
        (saveGeometryIssues.wallIds.size > 0 ||
          saveGeometryIssues.zoneIds.size > 0 ||
          saveGeometryIssues.tableIds.size > 0 ||
          saveGeometryIssues.chairIds.size > 0 ||
          saveGeometryIssues.fixtureIds.size > 0) && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border border-[rgb(var(--tc-border))] bg-[rgb(var(--tc-bg))] p-4 text-[rgb(var(--tc-fg))] shadow-xl">
              <h3 className="mb-2 text-lg font-semibold text-red-600">Конфликты геометрии</h3>
              <p className="mb-3 text-sm text-[rgb(var(--tc-muted))]">
                Красным отмечены пересекающиеся стены, зоны с наложением площади и мебель с
                пересечением габаритов. Сохранить в таком виде или вернуться к правкам?
              </p>
              <div className="mb-4 max-h-[280px] overflow-auto rounded-lg border border-[rgb(var(--tc-border))] bg-[#fafafa] p-1">
                <svg
                  viewBox={`0 0 ${contentWidth} ${contentHeight}`}
                  className="h-auto w-full"
                  preserveAspectRatio="xMidYMid meet"
                >
                  <rect x="0" y="0" width={contentWidth} height={contentHeight} fill="#fafafa" />
                  {walls.map((wall) => (
                    <line
                      key={`c-${wall.id}`}
                      x1={wall.start.x}
                      y1={wall.start.y}
                      x2={wall.end.x}
                      y2={wall.end.y}
                      stroke={saveGeometryIssues.wallIds.has(wall.id) ? '#dc2626' : '#111827'}
                      strokeWidth={saveGeometryIssues.wallIds.has(wall.id) ? 8 : 5}
                      strokeLinecap="round"
                    />
                  ))}
                  {roomZones.map((zone) => (
                    <polygon
                      key={`cz-${zone.id}`}
                      points={zone.points.map((p) => `${p.x},${p.y}`).join(' ')}
                      fill={
                        saveGeometryIssues.zoneIds.has(zone.id)
                          ? 'rgba(220,38,38,0.35)'
                          : 'rgba(59,130,246,0.08)'
                      }
                      stroke={saveGeometryIssues.zoneIds.has(zone.id) ? '#dc2626' : '#94a3b8'}
                      strokeWidth={saveGeometryIssues.zoneIds.has(zone.id) ? 3 : 1.5}
                    />
                  ))}
                  {tables.map((table) => {
                    const b = furnitureBoundsPx(table, PX_PER_METER);
                    const conflict = saveGeometryIssues.tableIds.has(table.id);
                    return (
                      <rect
                        key={`ct-${table.id}`}
                        x={b.x}
                        y={b.y}
                        width={b.w}
                        height={b.h}
                        rx={4}
                        fill={conflict ? 'rgba(220,38,38,0.35)' : 'rgba(146,64,14,0.25)'}
                        stroke={conflict ? '#dc2626' : '#92400e'}
                        strokeWidth={conflict ? 3 : 2}
                      />
                    );
                  })}
                  {chairs.map((chair) => {
                    const b = furnitureBoundsPx(chair, PX_PER_METER);
                    const conflict = saveGeometryIssues.chairIds.has(chair.id);
                    return (
                      <g key={`cc-${chair.id}`}>
                        <rect
                          x={b.x + b.w * 0.12}
                          y={b.y + b.h * 0.08}
                          width={b.w * 0.76}
                          height={b.h * 0.22}
                          rx={3}
                          fill={conflict ? 'rgba(220,38,38,0.35)' : 'rgba(87,83,78,0.25)'}
                          stroke={conflict ? '#dc2626' : '#57534e'}
                          strokeWidth={conflict ? 3 : 1.5}
                        />
                        <rect
                          x={b.x + b.w * 0.18}
                          y={b.y + b.h * 0.3}
                          width={b.w * 0.64}
                          height={b.h * 0.55}
                          rx={4}
                          fill={conflict ? 'rgba(220,38,38,0.35)' : 'rgba(87,83,78,0.25)'}
                          stroke={conflict ? '#dc2626' : '#57534e'}
                          strokeWidth={conflict ? 3 : 2}
                        />
                      </g>
                    );
                  })}
                </svg>
              </div>
              <div className="flex flex-wrap justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSaveGeometryIssues(null)}
                  className="rounded-lg border border-[rgb(var(--tc-border))] px-3 py-2 text-sm"
                >
                  Вернуться к редактированию
                </button>
                <button
                  type="button"
                  onClick={() => void save()}
                  className="rounded-lg bg-red-600 px-3 py-2 text-sm text-white"
                >
                  Сохранить как есть
                </button>
              </div>
            </div>
          </div>
        )}
    </div>
  );
}
