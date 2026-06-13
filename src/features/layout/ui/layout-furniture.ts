/** Plan furniture: tables and chairs on cafe layout canvas */

import type { ChairVariant } from './layout-editor-catalog';
import type { LayoutElementRecord } from './layout-api-types';

export type Point = { x: number; y: number };

export type TableShape = 'rect' | 'rounded' | 'oval';

export type PlanTable = {
  id: string;
  name: string;
  x: number;
  y: number;
  widthM: number;
  heightM: number;
  shape?: TableShape;
  rotationDeg?: number;
  presetId?: string;
};

export type PlanChair = {
  id: string;
  name: string;
  x: number;
  y: number;
  widthM: number;
  heightM: number;
  rotationDeg?: number;
  variant?: ChairVariant;
  presetId?: string;
};

export type FurniturePreset = {
  id: string;
  name: string;
  widthM: number;
  heightM: number;
};

export type FurnitureDefaults = { name: string; widthM: number; heightM: number };

const DEFAULT_TABLE: FurnitureDefaults = { name: 'Стол', widthM: 1.2, heightM: 0.8 };
const DEFAULT_CHAIR: FurnitureDefaults = { name: 'Стул', widthM: 0.45, heightM: 0.45 };

export function metersToPx(m: number, pxPerMeter: number) {
  return m * pxPerMeter;
}

export function furnitureBoundsPx(
  item: { x: number; y: number; widthM: number; heightM: number },
  pxPerMeter: number,
) {
  const w = metersToPx(item.widthM, pxPerMeter);
  const h = metersToPx(item.heightM, pxPerMeter);
  return {
    x: item.x - w / 2,
    y: item.y - h / 2,
    w,
    h,
  };
}

/** Canvas corners of a centered furniture footprint, accounting for rotationDeg. */
export function furnitureOrientedCorners(
  item: { x: number; y: number; widthM: number; heightM: number; rotationDeg?: number },
  pxPerMeter: number,
): Point[] {
  const w = metersToPx(item.widthM, pxPerMeter);
  const h = metersToPx(item.heightM, pxPerMeter);
  const cx = item.x;
  const cy = item.y;
  const rad = ((item.rotationDeg ?? 0) * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  const hw = w / 2;
  const hh = h / 2;
  const local: Point[] = [
    { x: -hw, y: -hh },
    { x: hw, y: -hh },
    { x: hw, y: hh },
    { x: -hw, y: hh },
  ];
  return local.map((p) => ({
    x: cx + p.x * cos - p.y * sin,
    y: cy + p.x * sin + p.y * cos,
  }));
}

export function hitTestTable(tables: PlanTable[], p: Point, pxPerMeter: number): PlanTable | null {
  for (let i = tables.length - 1; i >= 0; i--) {
    const t = tables[i];
    const b = furnitureBoundsPx(t, pxPerMeter);
    if (p.x >= b.x && p.x <= b.x + b.w && p.y >= b.y && p.y <= b.y + b.h) return t;
  }
  return null;
}

export function hitTestChair(chairs: PlanChair[], p: Point, pxPerMeter: number): PlanChair | null {
  for (let i = chairs.length - 1; i >= 0; i--) {
    const c = chairs[i];
    const b = furnitureBoundsPx(c, pxPerMeter);
    if (p.x >= b.x && p.x <= b.x + b.w && p.y >= b.y && p.y <= b.y + b.h) return c;
  }
  return null;
}

function elementProps(el: LayoutElementRecord): Record<string, unknown> {
  return el.props && typeof el.props === 'object' ? el.props : {};
}

export function extractTables(elements: LayoutElementRecord[]): PlanTable[] {
  return (elements || [])
    .filter((el) => el?.elementType === 'TABLE')
    .map((el) => {
      const g = (el.geometry || {}) as Record<string, unknown>;
      const props = elementProps(el);
      const x = Number(g.x);
      const y = Number(g.y);
      const widthM = Number(g.widthM ?? props.widthM);
      const heightM = Number(g.heightM ?? props.heightM);
      if (![x, y, widthM, heightM].every(Number.isFinite)) return null;
      const shapeRaw = props.shape ?? g.shape;
      const shape: TableShape = shapeRaw === 'rounded' || shapeRaw === 'oval' ? shapeRaw : 'rect';
      const rotationDeg = Number(props.rotationDeg ?? g.rotationDeg);
      return {
        id: String(el.id || crypto.randomUUID()),
        name: String(el.name || 'Стол'),
        x,
        y,
        widthM,
        heightM,
        shape,
        rotationDeg: Number.isFinite(rotationDeg) ? rotationDeg : 0,
        presetId: typeof props.presetId === 'string' ? props.presetId : undefined,
      } satisfies PlanTable;
    })
    .filter(Boolean) as PlanTable[];
}

export function extractChairs(elements: LayoutElementRecord[]): PlanChair[] {
  return (elements || [])
    .filter((el) => el?.elementType === 'CHAIR')
    .map((el) => {
      const g = (el.geometry || {}) as Record<string, unknown>;
      const props = elementProps(el);
      const x = Number(g.x);
      const y = Number(g.y);
      const widthM = Number(g.widthM ?? props.widthM);
      const heightM = Number(g.heightM ?? props.heightM);
      if (![x, y, widthM, heightM].every(Number.isFinite)) return null;
      const rotationDeg = Number(props.rotationDeg ?? g.rotationDeg);
      const variantRaw = props.variant;
      const variant: ChairVariant =
        variantRaw === 'bar' || variantRaw === 'office' || variantRaw === 'pouf'
          ? variantRaw
          : 'standard';
      return {
        id: String(el.id || crypto.randomUUID()),
        name: String(el.name || 'Стул'),
        x,
        y,
        widthM,
        heightM,
        rotationDeg: Number.isFinite(rotationDeg) ? rotationDeg : 0,
        variant,
        presetId: typeof props.presetId === 'string' ? props.presetId : undefined,
      } satisfies PlanChair;
    })
    .filter(Boolean) as PlanChair[];
}

export function tableToElement(t: PlanTable) {
  return {
    id: t.id,
    elementType: 'TABLE',
    name: t.name,
    geometry: {
      x: Math.round(t.x * 100) / 100,
      y: Math.round(t.y * 100) / 100,
      widthM: Math.round(t.widthM * 100) / 100,
      heightM: Math.round(t.heightM * 100) / 100,
      shape: t.shape || 'rect',
      rotationDeg: t.rotationDeg ?? 0,
    },
    props: {
      presetId: t.presetId,
      widthM: t.widthM,
      heightM: t.heightM,
      shape: t.shape || 'rect',
      rotationDeg: t.rotationDeg ?? 0,
    },
  };
}

export function chairToElement(c: PlanChair) {
  return {
    id: c.id,
    elementType: 'CHAIR',
    name: c.name,
    geometry: {
      x: Math.round(c.x * 100) / 100,
      y: Math.round(c.y * 100) / 100,
      widthM: Math.round(c.widthM * 100) / 100,
      heightM: Math.round(c.heightM * 100) / 100,
      rotationDeg: c.rotationDeg ?? 0,
    },
    props: {
      presetId: c.presetId,
      widthM: c.widthM,
      heightM: c.heightM,
      rotationDeg: c.rotationDeg ?? 0,
      variant: c.variant || 'standard',
    },
  };
}

export function furnitureTransform(item: { x: number; y: number; rotationDeg?: number }) {
  const r = item.rotationDeg ?? 0;
  return r ? `rotate(${r} ${item.x} ${item.y})` : undefined;
}

function readPresetList(
  schema: unknown,
  key: 'editorTablePresets' | 'editorChairPresets',
): FurniturePreset[] {
  const root =
    schema && typeof schema === 'object' && schema !== null
      ? (schema as Record<string, unknown>)
      : null;
  const raw = root?.[key];
  if (!Array.isArray(raw)) return [];
  return raw
    .map((p: unknown) => {
      const row = p && typeof p === 'object' ? (p as Record<string, unknown>) : null;
      const id = typeof row?.id === 'string' ? row.id : '';
      const name = typeof row?.name === 'string' ? row.name : '';
      const widthM = Number(row?.widthM);
      const heightM = Number(row?.heightM);
      if (!id || !name || !Number.isFinite(widthM) || !Number.isFinite(heightM)) return null;
      return { id, name, widthM, heightM } satisfies FurniturePreset;
    })
    .filter(Boolean) as FurniturePreset[];
}

export function readTableDefaults(schema: unknown): FurnitureDefaults {
  const root =
    schema && typeof schema === 'object' && schema !== null
      ? (schema as Record<string, unknown>)
      : null;
  const d = root?.lastTableDefaults;
  if (d && typeof d === 'object' && d !== null) {
    const o = d as Record<string, unknown>;
    return {
      name: String(o.name || DEFAULT_TABLE.name),
      widthM: Math.min(10, Math.max(0.2, Number(o.widthM) || DEFAULT_TABLE.widthM)),
      heightM: Math.min(10, Math.max(0.2, Number(o.heightM) || DEFAULT_TABLE.heightM)),
    };
  }
  return { ...DEFAULT_TABLE };
}

export function readChairDefaults(schema: unknown): FurnitureDefaults {
  const root =
    schema && typeof schema === 'object' && schema !== null
      ? (schema as Record<string, unknown>)
      : null;
  const d = root?.lastChairDefaults;
  if (d && typeof d === 'object' && d !== null) {
    const o = d as Record<string, unknown>;
    return {
      name: String(o.name || DEFAULT_CHAIR.name),
      widthM: Math.min(3, Math.max(0.2, Number(o.widthM) || DEFAULT_CHAIR.widthM)),
      heightM: Math.min(3, Math.max(0.2, Number(o.heightM) || DEFAULT_CHAIR.heightM)),
    };
  }
  return { ...DEFAULT_CHAIR };
}

export function readTablePresets(schema: unknown, tables: PlanTable[]): FurniturePreset[] {
  const fromSchema = readPresetList(schema, 'editorTablePresets');
  const byKey = new Map<string, FurniturePreset>();
  for (const p of fromSchema) byKey.set(p.id, p);
  for (const t of tables) {
    const key = t.presetId || `${t.name}|${t.widthM}|${t.heightM}`;
    if (!byKey.has(key)) {
      byKey.set(key, {
        id: t.presetId || key,
        name: t.name,
        widthM: t.widthM,
        heightM: t.heightM,
      });
    }
  }
  return [...byKey.values()];
}

export function readChairPresets(schema: unknown, chairs: PlanChair[]): FurniturePreset[] {
  const fromSchema = readPresetList(schema, 'editorChairPresets');
  const byKey = new Map<string, FurniturePreset>();
  for (const p of fromSchema) byKey.set(p.id, p);
  for (const c of chairs) {
    const key = c.presetId || `${c.name}|${c.widthM}|${c.heightM}`;
    if (!byKey.has(key)) {
      byKey.set(key, {
        id: c.presetId || key,
        name: c.name,
        widthM: c.widthM,
        heightM: c.heightM,
      });
    }
  }
  return [...byKey.values()];
}

export function cloneTables(list: PlanTable[]): PlanTable[] {
  return list.map((t) => ({ ...t }));
}

export function cloneChairs(list: PlanChair[]): PlanChair[] {
  return list.map((c) => ({ ...c }));
}

export function visitFurniturePoints(
  tables: PlanTable[],
  chairs: PlanChair[],
  visit: (p: Point) => void,
) {
  for (const t of tables) visit({ x: t.x, y: t.y });
  for (const c of chairs) visit({ x: c.x, y: c.y });
}
