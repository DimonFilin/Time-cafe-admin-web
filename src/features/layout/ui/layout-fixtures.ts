import type { SofaStyle } from './layout-editor-catalog';
import { findPlacementCollisionIds } from './layout-collision';
import { furnitureBoundsPx, geometrySizeMeters } from './layout-furniture';
import { newLayoutId } from './layout-id';

export type Point = { x: number; y: number };

export type FixtureKind =
  | 'sofa'
  | 'toilet'
  | 'sink'
  | 'cabinet'
  | 'tv_wall'
  | 'tv_stand'
  | 'whiteboard';

export type PlanFixture = {
  id: string;
  name: string;
  kind: FixtureKind;
  x: number;
  y: number;
  widthM: number;
  heightM: number;
  rotationDeg?: number;
  sofaStyle?: SofaStyle;
  skipCollision?: boolean;
};

const DEFAULTS: Record<FixtureKind, { name: string; widthM: number; heightM: number }> = {
  sofa: { name: 'Диван', widthM: 2, heightM: 0.9 },
  toilet: { name: 'Туалет', widthM: 0.5, heightM: 0.75 },
  sink: { name: 'Умывальник', widthM: 0.6, heightM: 0.5 },
  cabinet: { name: 'Шкаф', widthM: 1, heightM: 0.45 },
  tv_wall: { name: 'ТВ', widthM: 1.2, heightM: 0.08 },
  tv_stand: { name: 'ТВ с тумбой', widthM: 1.2, heightM: 0.24 },
  whiteboard: { name: 'Мультиборд', widthM: 2, heightM: 0.12 },
};

export function defaultFixture(kind: FixtureKind): PlanFixture {
  const d = DEFAULTS[kind];
  return {
    id: '',
    name: d.name,
    kind,
    x: 0,
    y: 0,
    widthM: d.widthM,
    heightM: d.heightM,
    rotationDeg: 0,
    skipCollision: kind === 'tv_stand' || kind === 'whiteboard',
  };
}

export function fixtureElementType(kind: FixtureKind): string {
  const map: Record<FixtureKind, string> = {
    sofa: 'SOFA',
    toilet: 'TOILET',
    sink: 'SINK',
    cabinet: 'CABINET',
    tv_wall: 'TV',
    tv_stand: 'TV',
    whiteboard: 'WHITEBOARD',
  };
  return map[kind];
}

export function extractFixtures(elements: Array<unknown>): PlanFixture[] {
  return (elements || [])
    .filter((el) => {
      const et = String((el as { elementType?: string })?.elementType || '');
      return ['SOFA', 'TOILET', 'SINK', 'CABINET', 'TV', 'WHITEBOARD'].includes(et);
    })
    .map((el) => {
      const e = el as Record<string, unknown>;
      const et = String(e.elementType || '');
      const kindMap: Record<string, FixtureKind> = {
        SOFA: 'sofa',
        TOILET: 'toilet',
        SINK: 'sink',
        CABINET: 'cabinet',
        TV: (e.props as Record<string, unknown>)?.mount === 'stand' ? 'tv_stand' : 'tv_wall',
        WHITEBOARD: 'whiteboard',
      };
      const kind = kindMap[et];
      if (!kind) return null;
      const g = (e.geometry || {}) as Record<string, unknown>;
      const props = (e.props || {}) as Record<string, unknown>;
      const x = Number(g.x);
      const y = Number(g.y);
      const size = geometrySizeMeters(g, props);
      if (!size || ![x, y].every(Number.isFinite)) return null;
      const { widthM, heightM } = size;
      return {
        id: String(e.id || newLayoutId()),
        name: String(e.name || DEFAULTS[kind].name),
        kind,
        x,
        y,
        widthM,
        heightM,
        rotationDeg: Number((e.props as Record<string, unknown>)?.rotationDeg) || 0,
        sofaStyle:
          (e.props as Record<string, unknown>)?.sofaStyle === 'corner' ? 'corner' : 'standard',
        skipCollision:
          Boolean((e.props as Record<string, unknown>)?.skipCollision) ||
          kind === 'tv_stand' ||
          kind === 'whiteboard',
      } satisfies PlanFixture;
    })
    .filter(Boolean) as PlanFixture[];
}

export function fixtureToElement(f: PlanFixture) {
  const et = fixtureElementType(f.kind);
  return {
    id: f.id,
    elementType: et,
    name: f.name,
    geometry: {
      x: Math.round(f.x * 100) / 100,
      y: Math.round(f.y * 100) / 100,
      widthM: Math.round(f.widthM * 100) / 100,
      heightM: Math.round(f.heightM * 100) / 100,
      rotationDeg: f.rotationDeg ?? 0,
    },
    props: {
      kind: f.kind,
      widthM: f.widthM,
      heightM: f.heightM,
      rotationDeg: f.rotationDeg ?? 0,
      sofaStyle: f.sofaStyle,
      skipCollision: f.skipCollision,
      mount: f.kind === 'tv_stand' ? 'stand' : f.kind === 'tv_wall' ? 'wall' : undefined,
    },
  };
}

export function hitTestFixture(
  fixtures: PlanFixture[],
  p: Point,
  pxPerMeter: number,
): PlanFixture | null {
  for (let i = fixtures.length - 1; i >= 0; i--) {
    const f = fixtures[i];
    const b = furnitureBoundsPx(f, pxPerMeter);
    if (p.x >= b.x && p.x <= b.x + b.w && p.y >= b.y && p.y <= b.y + b.h) return f;
  }
  return null;
}

export function cloneFixtures(list: PlanFixture[]) {
  return list.map((f) => ({ ...f }));
}

export function findFixtureCollisionIds(fixtures: PlanFixture[], pxPerMeter: number): Set<string> {
  return findPlacementCollisionIds([], [], fixtures, [], pxPerMeter).fixtureIds;
}
