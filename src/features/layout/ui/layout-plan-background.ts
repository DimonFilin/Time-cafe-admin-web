export type PlanBackgroundImage = {
  dataUrl: string;
  x: number;
  y: number;
  widthM: number;
  heightM: number;
  opacity?: number;
};

export function readPlanBackground(schema: unknown): PlanBackgroundImage | null {
  const root =
    schema && typeof schema === 'object' && schema !== null
      ? (schema as Record<string, unknown>)
      : null;
  const raw = root?.planBackgroundImage;
  if (!raw || typeof raw !== 'object' || raw === null) return null;
  const m = raw as Record<string, unknown>;
  const dataUrl = typeof m.dataUrl === 'string' ? m.dataUrl : '';
  if (!dataUrl.startsWith('data:image/')) return null;
  const x = Number(m.x);
  const y = Number(m.y);
  const widthM = Number(m.widthM);
  const heightM = Number(m.heightM);
  if (![x, y, widthM, heightM].every(Number.isFinite)) return null;
  const opacity = m.opacity != null ? Number(m.opacity) : 1;
  return {
    dataUrl,
    x,
    y,
    widthM: Math.max(0.5, widthM),
    heightM: Math.max(0.5, heightM),
    opacity: Number.isFinite(opacity) ? Math.min(1, Math.max(0.1, opacity)) : 1,
  };
}

export function defaultPlanBackground(
  field: { widthM: number; heightM: number },
  centerPx: { x: number; y: number },
): PlanBackgroundImage {
  return {
    dataUrl: '',
    x: centerPx.x,
    y: centerPx.y,
    widthM: field.widthM,
    heightM: field.heightM,
    opacity: 0.85,
  };
}
