'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
  furnitureBoundsPx,
  furnitureOrientedCorners,
  hitTestChair,
  hitTestTable,
  readChairPresets,
  readTablePresets,
  tableToElement,
  visitFurniturePoints,
} from './layout-furniture';
import { CurrencyUnitLabel } from '@/shared/ui/currency/CurrencyUnitLabel';
import { t } from '@/i18n';
import { BlurNumberInput } from './BlurNumberInput';
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
import { findPlacementCollisionIds, orientedItemIntersectsNormRect } from './layout-collision';
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
import { billingModesAvailable, parseRoomBilling, patchRoomBilling } from './room-billing';
import { LayoutPlanPreviewModal } from './LayoutPlanPreviewModal';
import { Modal } from '@/shared/ui/modal/Modal';
import { Button } from '@/shared/ui/button/Button';
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
const GRID_STEP = 24;
/** One grid step (24 px) = 10 cm in real space */
const METERS_PER_PX = 0.1 / GRID_STEP;
/** Pixels per one meter in plan coordinates (inverse of METERS_PER_PX) */
const PX_PER_METER = GRID_STEP / 0.1;
const GRID_MAJOR_STEP = GRID_STEP * 5;
const DELETE_MARQUEE_PX = 6;
const SNAP_DISTANCE = 14;
const HISTORY_LIMIT = 50;
/** Default zoom: ~10% more plan visible; UI «100%» = this value */
const CANVAS_BASE_ZOOM = 0.9;
const CANVAS_ZOOM_MAX = 2.5;
/** At 11×11 m field, minimum zoom factor (shown as ~50% in UI) */
const ZOOM_MIN_AT_REF_FIELD_M = 0.5;
const ZOOM_REF_FIELD_M = 11;
const ZOOM_VIEWPORT_REF_W = 1200;
const ZOOM_VIEWPORT_REF_H = 720;
const ZOOM_ABSOLUTE_MIN = 0.12;
/** Base multiplier for labels drawn on the SVG plan (rooms, furniture, dimensions) */
const PLAN_SVG_LABEL_SCALE = 1.7;
const PLAN_LABEL_FONT = {
  wallLength: 13,
  zoneName: 18,
  zonePercent: 16,
  zoneArea: 15,
  zoneEditIcon: 15,
  table: 14,
  chair: 13,
  fixture: 12,
  stair: 13,
} as const;
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

/** Smaller min zoom for larger fields so the full plan can fit on screen */
function computeCanvasZoomMin(
  contentW: number,
  contentH: number,
  fieldWM: number,
  fieldHM: number,
): number {
  const spanM = Math.max(fieldWM, fieldHM, 4);
  const byFieldSize = ZOOM_MIN_AT_REF_FIELD_M * (ZOOM_REF_FIELD_M / spanM);
  const fitW = ZOOM_VIEWPORT_REF_W / Math.max(contentW, 1);
  const fitH = ZOOM_VIEWPORT_REF_H / Math.max(contentH, 1);
  const fitViewport = Math.min(fitW, fitH) * 0.96;
  return round2(
    Math.max(ZOOM_ABSOLUTE_MIN, Math.min(CANVAS_BASE_ZOOM, byFieldSize, fitViewport)),
  );
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
  void wallPreviewEnd;
  void roomPreviewEnd;
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
        id: String(el.id || crypto.randomUUID()),
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
        id: String(el.id || crypto.randomUUID()),
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
  const [saveSuccessOpen, setSaveSuccessOpen] = useState(false);
  const [planPreviewOpen, setPlanPreviewOpen] = useState(false);
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
  const [doorHingeSide, setDoorHingeSide] = useState<'left' | 'right'>('left');
  const [stairKind, setStairKind] = useState<StairKind>('rect');
  const [sofaStyle, setSofaStyle] = useState<SofaStyle>('standard');
  const [fixtureDraft, setFixtureDraft] = useState<PlanFixture>(defaultFixture('sofa'));
  const [doorDraft, setDoorDraft] = useState<PlacementDraft>({
    ...DEFAULT_WINDOW_DRAFT,
    name: 'Дверь',
    widthM: 0.9,
  });
  const [stairDraft, setStairDraft] = useState<PlanStair>(defaultStair('rect'));
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
  const [tableShapeDraft, setTableShapeDraft] = useState<TableShape>('rect');
  const [wallThicknessPx, setWallThicknessPx] = useState(DEFAULT_WALL_THICKNESS_PX);
  const editPickStackKeyRef = useRef('');
  const [draftWallStart, setDraftWallStart] = useState<Point | null>(null);
  const [draftRoomPoints, setDraftRoomPoints] = useState<Point[]>([]);
  const [cursorPoint, setCursorPoint] = useState<Point | null>(null);
  const [roomPickerZoneId, setRoomPickerZoneId] = useState<string | null>(null);
  const [roomPickerValue, setRoomPickerValue] = useState<string>('');
  const [roomPickerDraft, setRoomPickerDraft] = useState({
    name: '',
    capacity: 4,
    status: 'ACTIVE',
    description: '',
  });
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
    stairIds: Set<string>;
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
    const nearest = nearestPoint(allNodes, cursorPoint);
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
        null,
        null,
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

  const canvasZoomMin = useMemo(
    () => computeCanvasZoomMin(contentWidth, contentHeight, planFieldM.widthM, planFieldM.heightM),
    [contentWidth, contentHeight, planFieldM.widthM, planFieldM.heightM],
  );

  const clampCanvasZoom = useCallback(
    (z: number) => Math.min(CANVAS_ZOOM_MAX, Math.max(canvasZoomMin, round2(z))),
    [canvasZoomMin],
  );

  const wallJointsMap = useMemo(() => buildWallJointsMap(walls, WELD_EPS), [walls]);

  const selectedCafe = useMemo(() => cafes.find((c) => c.id === cafeId) ?? null, [cafes, cafeId]);

  useEffect(() => {
    const loadCafes = async () => {
      try {
        if (scope === 'cafe-admin') {
          const res = await fetch('/api/cafe-admin/cafe', { credentials: 'include' });
          const json = await res.json();
          if (!res.ok) {
            throw new Error(
              typeof json?.message === 'string'
                ? json.message
                : `Не удалось загрузить кафе (${res.status})`,
            );
          }
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
          if (!res.ok) {
            throw new Error(
              typeof json?.message === 'string'
                ? json.message
                : `Не удалось загрузить кафе (${res.status})`,
            );
          }
          if (json?.cafe?.id) {
            const option = { id: json.cafe.id, name: json.cafe.name || 'Cafe' };
            setCafes([option]);
            setCafeId(json.cafe.id);
          }
          return;
        }
        const res = await fetch('/api/brand/cafes?page=1&limit=100', {
          credentials: 'include',
        });
        const json = await res.json();
        if (!res.ok) {
          const msg =
            typeof json?.message === 'string'
              ? json.message
              : `Не удалось загрузить кафе (${res.status})`;
          throw new Error(msg);
        }
        const raw = json?.items ?? json?.cafes ?? (Array.isArray(json) ? json : []);
        const list = raw.map((c: { id: string; name?: string }) => ({
          id: c.id,
          name: c.name || 'Без названия',
        }));
        setCafes(list);
        if (list[0]?.id) setCafeId(list[0].id);
      } catch (e) {
        setError(e instanceof Error ? e.message : t('apiErrors.loadCafes'));
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

  const editTableFocused = drawMode === 'EDIT' && editFocus?.type === 'table';

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

  const patchTableById = (id: string, patch: Partial<PlanTable>) => {
    const next = tables.map((t) => (t.id === id ? { ...t, ...patch } : t));
    setTables(next);
    geomRef.current = { ...geomRef.current, tables: next };
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
    return editFocus;
  }, [drawMode, editFocus]);

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
        setError(e instanceof Error ? e.message : t('apiErrors.loadLayoutData'));
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
      setCanvasZoom((prev) => {
        const next = clampCanvasZoom(prev + step);
        return next === prev ? prev : next;
      });
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [clampCanvasZoom]);

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
        throw new Error(json?.message || json?.error || t('apiErrors.saveLayout'));
      }
      const savedElements = Array.isArray(json?.elements) ? json.elements : [];
      const ew = extractWalls(savedElements);
      const rz = extractRoomZones(savedElements);
      const et = extractTables(savedElements);
      const ec = extractChairs(savedElements);
      const ewin = extractWindows(savedElements);
      setState(json);
      setWalls(ew);
      setRoomZones(rz);
      setTables(et);
      setChairs(ec);
      setWindows(sanitizeWindows(ewin, ew));
      const efix = extractFixtures(savedElements);
      const edoor = extractDoors(savedElements);
      const est = extractStairs(savedElements);
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
      setSaveSuccessOpen(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : t('apiErrors.saveLayout'));
    } finally {
      setSaving(false);
    }
  };

  const requestSave = () => {
    const wallIds = findIntersectingWallIds(walls);
    const zoneIds = findOverlappingRoomZoneIds(roomZones);
    const placementHits = findPlacementCollisionIds(
      tables,
      chairs,
      fixtures,
      stairs,
      PX_PER_METER,
    );
    if (
      wallIds.size > 0 ||
      zoneIds.size > 0 ||
      placementHits.tableIds.size > 0 ||
      placementHits.chairIds.size > 0 ||
      placementHits.fixtureIds.size > 0 ||
      placementHits.stairIds.size > 0
    ) {
      setSaveGeometryIssues({
        wallIds,
        zoneIds,
        tableIds: placementHits.tableIds,
        chairIds: placementHits.chairIds,
        fixtureIds: placementHits.fixtureIds,
        stairIds: placementHits.stairIds,
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
