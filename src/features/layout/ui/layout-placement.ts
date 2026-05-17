/** Shared draft / preset types for placing layout elements (furniture, windows). */

export type PlacementDraft = {
  name: string;
  widthM: number;
  /** Depth / height in meters (furniture); ignored for windows */
  depthM: number;
};

export type PlacementPreset = {
  id: string;
  name: string;
  widthM: number;
  depthM: number;
};

export const DEFAULT_TABLE_DRAFT: PlacementDraft = {
  name: 'Стол',
  widthM: 1.2,
  depthM: 0.8,
};

export const DEFAULT_CHAIR_DRAFT: PlacementDraft = {
  name: 'Стул',
  widthM: 0.45,
  depthM: 0.45,
};

export const DEFAULT_WINDOW_DRAFT: PlacementDraft = {
  name: 'Окно',
  widthM: 1.2,
  depthM: 0,
};

export function readPlacementDefaults(
  schema: unknown,
  key: 'lastTableDefaults' | 'lastChairDefaults' | 'lastWindowDefaults',
  fallback: PlacementDraft,
): PlacementDraft {
  const root =
    schema && typeof schema === 'object' && schema !== null
      ? (schema as Record<string, unknown>)
      : null;
  const d = root?.[key];
  if (d && typeof d === 'object' && d !== null) {
    const o = d as Record<string, unknown>;
    return {
      name: String(o.name || fallback.name),
      widthM: Math.min(10, Math.max(0.2, Number(o.widthM) || fallback.widthM)),
      depthM: Math.min(10, Math.max(0, Number(o.depthM ?? o.heightM) || fallback.depthM)),
    };
  }
  return { ...fallback };
}

export function readPresetList(
  schema: unknown,
  key: 'editorTablePresets' | 'editorChairPresets' | 'editorWindowPresets',
): PlacementPreset[] {
  const root =
    schema && typeof schema === 'object' && schema !== null
      ? (schema as Record<string, unknown>)
      : null;
  const raw = root?.[key];
  if (!Array.isArray(raw)) return [];
  return raw
    .map((p: unknown) => {
      const o = p && typeof p === 'object' ? (p as Record<string, unknown>) : null;
      const id = typeof o?.id === 'string' ? o.id : '';
      const name = typeof o?.name === 'string' ? o.name : '';
      const widthM = Number(o?.widthM);
      const depthM = Number(o?.depthM ?? o?.heightM);
      if (!id || !name || !Number.isFinite(widthM) || !Number.isFinite(depthM)) return null;
      return { id, name, widthM, depthM } satisfies PlacementPreset;
    })
    .filter(Boolean) as PlacementPreset[];
}
