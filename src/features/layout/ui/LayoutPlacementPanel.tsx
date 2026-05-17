'use client';

import type { PlacementDraft, PlacementPreset } from './layout-placement';

type Props = {
  draft: PlacementDraft;
  onDraftChange: (patch: Partial<PlacementDraft>) => void;
  placeArmed: boolean;
  onArmPlace: () => void;
  presets?: PlacementPreset[];
  presetPick?: string;
  onPresetPick?: (id: string) => void;
  showDepth?: boolean;
  depthLabel?: string;
  widthLabel?: string;
  nameLabel?: string;
  presetLabel?: string;
  hint?: string;
  hidePlaceButton?: boolean;
};

export function LayoutPlacementPanel({
  draft,
  onDraftChange,
  placeArmed,
  onArmPlace,
  presets,
  presetPick,
  onPresetPick,
  showDepth = true,
  depthLabel = 'Глубина (м)',
  widthLabel = 'Ширина (м)',
  nameLabel = 'Название',
  presetLabel = 'Тип',
  hint = 'После установки параметры сохраняются для следующего объекта.',
  hidePlaceButton = false,
}: Props) {
  return (
    <div className="mb-3 flex flex-wrap items-end gap-3 rounded-lg border border-[rgb(var(--tc-border))] bg-[rgb(var(--tc-surface-1))]/50 p-3">
      {presets && presets.length > 0 && onPresetPick && presetPick != null && (
        <div className="min-w-[200px]">
          <label className="mb-0.5 block text-xs text-[rgb(var(--tc-muted))]">{presetLabel}</label>
          <select
            value={presetPick}
            onChange={(e) => onPresetPick(e.target.value)}
            className="w-full rounded-lg border border-[rgb(var(--tc-border))] bg-[rgb(var(--tc-bg))] px-2 py-1 text-sm"
          >
            <option value="__new__">Новый тип…</option>
            {presets.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.widthM}×{showDepth ? p.depthM : '—'} м)
              </option>
            ))}
          </select>
        </div>
      )}
      <div>
        <label className="mb-0.5 block text-xs text-[rgb(var(--tc-muted))]">{nameLabel}</label>
        <input
          type="text"
          value={draft.name}
          onChange={(e) => onDraftChange({ name: e.target.value })}
          className="w-36 rounded-lg border border-[rgb(var(--tc-border))] bg-[rgb(var(--tc-bg))] px-2 py-1"
        />
      </div>
      <div>
        <label className="mb-0.5 block text-xs text-[rgb(var(--tc-muted))]">{widthLabel}</label>
        <input
          type="number"
          min={0.2}
          max={10}
          step={0.05}
          value={draft.widthM}
          onChange={(e) => onDraftChange({ widthM: Number(e.target.value) || 0.2 })}
          className="w-24 rounded-lg border border-[rgb(var(--tc-border))] bg-[rgb(var(--tc-bg))] px-2 py-1"
        />
      </div>
      {showDepth && (
        <div>
          <label className="mb-0.5 block text-xs text-[rgb(var(--tc-muted))]">{depthLabel}</label>
          <input
            type="number"
            min={0.2}
            max={10}
            step={0.05}
            value={draft.depthM}
            onChange={(e) => onDraftChange({ depthM: Number(e.target.value) || 0.2 })}
            className="w-24 rounded-lg border border-[rgb(var(--tc-border))] bg-[rgb(var(--tc-bg))] px-2 py-1"
          />
        </div>
      )}
      {!hidePlaceButton && (
        <div className="flex flex-col justify-end gap-1">
          <button
            type="button"
            onClick={onArmPlace}
            className="rounded-lg bg-[rgb(var(--tc-accent))] px-3 py-1.5 text-sm text-white"
          >
            {placeArmed ? 'Кликните на план…' : 'Установить на план'}
          </button>
          <p className="max-w-xs text-xs text-[rgb(var(--tc-muted))]">{hint}</p>
        </div>
      )}
      {hidePlaceButton && (
        <p className="max-w-xs self-end text-xs text-[rgb(var(--tc-muted))]">
          Кликните на план — объект поставится сразу. {hint}
        </p>
      )}
    </div>
  );
}
