import type { StairKind } from './layout-editor-catalog';
import { furnitureBoundsPx } from './layout-furniture';

export type Point = { x: number; y: number };

export type PlanStair = {
  id: string;
  name: string;
  x: number;
  y: number;
  widthM: number;
  heightM: number;
  rotationDeg?: number;
  kind: StairKind;
  /** Links two half_room segments with a dashed connector */
  pairId?: string;
  pairRole?: 'up' | 'down';
};

export function defaultStair(kind: StairKind = 'rect'): PlanStair {
  return {
    id: '',
    name: 'Лестница',
    x: 0,
    y: 0,
    widthM: kind === 'round' ? 1.5 : 1.2,
    heightM: kind === 'round' ? 1.5 : 2.4,
    rotationDeg: 0,
    kind,
  };
}

export function extractStairs(elements: Array<unknown>): PlanStair[] {
  return (elements || [])
    .filter((el) => (el as { elementType?: string })?.elementType === 'STAIR')
    .map((el) => {
      const e = el as Record<string, unknown>;
      const g = (e.geometry || {}) as Record<string, unknown>;
      const x = Number(g.x);
      const y = Number(g.y);
      const widthM = Number(g.widthM);
      const heightM = Number(g.heightM);
      if (![x, y, widthM, heightM].every(Number.isFinite)) return null;
      const kindRaw = (e.props as Record<string, unknown>)?.kind;
      const kind: StairKind = kindRaw === 'round' || kindRaw === 'half_room' ? kindRaw : 'rect';
      const props = (e.props || {}) as Record<string, unknown>;
      return {
        id: String(e.id || crypto.randomUUID()),
        name: String(e.name || 'Лестница'),
        x,
        y,
        widthM,
        heightM,
        rotationDeg: Number(props.rotationDeg) || 0,
        kind,
        pairId: typeof props.pairId === 'string' ? props.pairId : undefined,
        pairRole: props.pairRole === 'up' || props.pairRole === 'down' ? props.pairRole : undefined,
      } satisfies PlanStair;
    })
    .filter(Boolean) as PlanStair[];
}

export function stairToElement(s: PlanStair) {
  return {
    id: s.id,
    elementType: 'STAIR',
    name: s.name,
    geometry: {
      x: Math.round(s.x * 100) / 100,
      y: Math.round(s.y * 100) / 100,
      widthM: Math.round(s.widthM * 100) / 100,
      heightM: Math.round(s.heightM * 100) / 100,
    },
    props: {
      kind: s.kind,
      rotationDeg: s.rotationDeg ?? 0,
      pairId: s.pairId,
      pairRole: s.pairRole,
    },
  };
}

export function hitTestStair(stairs: PlanStair[], p: Point, pxPerMeter: number): PlanStair | null {
  for (let i = stairs.length - 1; i >= 0; i--) {
    const s = stairs[i];
    const b = furnitureBoundsPx(s, pxPerMeter);
    if (p.x >= b.x && p.x <= b.x + b.w && p.y >= b.y && p.y <= b.y + b.h) return s;
  }
  return null;
}

export function cloneStairs(list: PlanStair[]) {
  return list.map((s) => ({ ...s }));
}
