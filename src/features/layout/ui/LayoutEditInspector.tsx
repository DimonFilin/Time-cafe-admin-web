'use client';

import { DOOR_KINDS, DOOR_SWINGS, type DoorKind, type DoorSwing } from './layout-editor-catalog';
import type { PlanChair, PlanTable, TableShape } from './layout-furniture';
import type { PlanDoor } from './layout-doors';
import type { PlanFixture } from './layout-fixtures';
import type { PlanStair } from './layout-stairs';
import type { PlanWindow } from './layout-windows';

export type LayoutEditFocus =
  | { type: 'wall'; id: string }
  | { type: 'zone'; id: string }
  | { type: 'table'; id: string }
  | { type: 'chair'; id: string }
  | { type: 'window'; id: string }
  | { type: 'fixture'; id: string }
  | { type: 'stair'; id: string }
  | { type: 'door'; id: string };

type RoomRow = {
  id?: string;
  name?: string;
  capacity?: number;
  status?: string;
  description?: string;
};

type Props = {
  focus: LayoutEditFocus;
  editSubMode: 'move' | 'rotate';
  rooms: RoomRow[];
  zoneRoomId: string | null;
  zoneAreaM2: number | null;
  table?: PlanTable;
  chair?: PlanChair;
  window?: PlanWindow;
  fixture?: PlanFixture;
  door?: PlanDoor;
  stair?: PlanStair;
  wallThicknessPx: number;
  onPatchZoneRoom: (roomId: string | null) => void;
  onPatchRoom: (roomId: string, patch: Record<string, unknown>) => void;
  onPatchTable: (patch: Partial<PlanTable>) => void;
  onPatchChair: (patch: Partial<PlanChair>) => void;
  onPatchWindow: (patch: Partial<PlanWindow>) => void;
  onPatchFixture: (patch: Partial<PlanFixture>) => void;
  onPatchDoor: (patch: Partial<PlanDoor>) => void;
  onPatchStair: (patch: Partial<PlanStair>) => void;
  onPatchWallThickness: (px: number) => void;
};

const inputCls =
  'rounded-lg border border-[rgb(var(--tc-border))] bg-[rgb(var(--tc-bg))] px-2 py-1';

export function LayoutEditInspector({
  focus,
  editSubMode,
  rooms,
  zoneRoomId,
  zoneAreaM2,
  table,
  chair,
  window: win,
  fixture,
  door,
  stair,
  wallThicknessPx,
  onPatchZoneRoom,
  onPatchRoom,
  onPatchTable,
  onPatchChair,
  onPatchWindow,
  onPatchFixture,
  onPatchDoor,
  onPatchStair,
  onPatchWallThickness,
}: Props) {
  const title =
    focus.type === 'zone'
      ? 'Зона комнаты'
      : focus.type === 'wall'
        ? 'Стена'
        : focus.type === 'table'
          ? `Стол «${table?.name || '—'}»`
          : focus.type === 'chair'
            ? `Стул «${chair?.name || '—'}»`
            : focus.type === 'window'
              ? `Окно «${win?.name || '—'}»`
              : focus.type === 'door'
                ? `Дверь «${door?.name || '—'}»`
                : focus.type === 'fixture'
                  ? `Интерьер «${fixture?.name || '—'}»`
                  : `Лестница «${stair?.name || '—'}»`;

  const room = zoneRoomId ? rooms.find((r) => r.id === zoneRoomId) : undefined;
  const moveMode = editSubMode === 'move';

  return (
    <div
      className="mb-2 flex flex-wrap items-end gap-3 rounded-lg border border-amber-500/45 bg-amber-500/8 p-3 text-sm"
      onMouseDown={(e) => e.stopPropagation()}
    >
      <span className="w-full text-xs font-semibold text-amber-900 dark:text-amber-100">
        {title}
        <span className="ml-2 font-normal text-[rgb(var(--tc-muted))]">
          (двойной клик — изоляция · Esc — весь план)
        </span>
      </span>

      {focus.type === 'zone' && (
        <>
          <div>
            <label className="mb-0.5 block text-xs text-[rgb(var(--tc-muted))]">
              Комната на плане
            </label>
            <select
              value={zoneRoomId ?? ''}
              onChange={(e) => onPatchZoneRoom(e.target.value || null)}
              className={`min-w-[12rem] ${inputCls}`}
            >
              <option value="">Не назначена</option>
              {rooms.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name || r.id}
                </option>
              ))}
            </select>
          </div>
          {zoneAreaM2 != null && (
            <p className="text-xs text-[rgb(var(--tc-muted))]">
              Площадь: {zoneAreaM2.toFixed(1)} m²
            </p>
          )}
          {room?.id && (
            <>
              <div>
                <label className="mb-0.5 block text-xs text-[rgb(var(--tc-muted))]">
                  Название комнаты
                </label>
                <input
                  type="text"
                  value={room.name || ''}
                  onChange={(e) => onPatchRoom(room.id!, { name: e.target.value })}
                  placeholder="Например, Зал А"
                  className={`w-44 ${inputCls}`}
                />
              </div>
              <div>
                <label className="mb-0.5 block text-xs text-[rgb(var(--tc-muted))]">
                  Вместимость
                </label>
                <input
                  type="number"
                  min={0}
                  value={room.capacity || 0}
                  onChange={(e) => onPatchRoom(room.id!, { capacity: Number(e.target.value) || 0 })}
                  className={`w-24 ${inputCls}`}
                />
              </div>
              <div>
                <label className="mb-0.5 block text-xs text-[rgb(var(--tc-muted))]">Статус</label>
                <select
                  value={room.status || 'ACTIVE'}
                  onChange={(e) => onPatchRoom(room.id!, { status: e.target.value })}
                  className={inputCls}
                >
                  <option value="ACTIVE">Активна</option>
                  <option value="INACTIVE">Неактивна</option>
                  <option value="MAINTENANCE">Обслуживание</option>
                </select>
              </div>
            </>
          )}
        </>
      )}

      {focus.type === 'wall' && moveMode && (
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
            onChange={(e) => onPatchWallThickness(Number(e.target.value) || 10)}
            className={`w-24 ${inputCls}`}
          />
        </div>
      )}

      {focus.type === 'table' && table && moveMode && (
        <>
          <div>
            <label className="mb-0.5 block text-xs text-[rgb(var(--tc-muted))]">Название</label>
            <input
              type="text"
              value={table.name}
              onChange={(e) => onPatchTable({ name: e.target.value })}
              className={`w-36 ${inputCls}`}
            />
          </div>
          <div>
            <label className="mb-0.5 block text-xs text-[rgb(var(--tc-muted))]">Ширина (м)</label>
            <input
              type="number"
              min={0.2}
              max={10}
              step={0.05}
              value={table.widthM}
              onChange={(e) => onPatchTable({ widthM: Number(e.target.value) || 0.2 })}
              className={`w-24 ${inputCls}`}
            />
          </div>
          <div>
            <label className="mb-0.5 block text-xs text-[rgb(var(--tc-muted))]">Глубина (м)</label>
            <input
              type="number"
              min={0.2}
              max={10}
              step={0.05}
              value={table.heightM}
              onChange={(e) => onPatchTable({ heightM: Number(e.target.value) || 0.2 })}
              className={`w-24 ${inputCls}`}
            />
          </div>
          <div>
            <label className="mb-0.5 block text-xs text-[rgb(var(--tc-muted))]">Форма</label>
            <select
              value={table.shape || 'rect'}
              onChange={(e) => onPatchTable({ shape: e.target.value as TableShape })}
              className={inputCls}
            >
              <option value="rect">Прямоугольник</option>
              <option value="rounded">Скруглённые углы</option>
              <option value="oval">Овал</option>
            </select>
          </div>
        </>
      )}

      {focus.type === 'chair' && chair && moveMode && (
        <>
          <div>
            <label className="mb-0.5 block text-xs text-[rgb(var(--tc-muted))]">Название</label>
            <input
              type="text"
              value={chair.name}
              onChange={(e) => onPatchChair({ name: e.target.value })}
              className={`w-36 ${inputCls}`}
            />
          </div>
          <div>
            <label className="mb-0.5 block text-xs text-[rgb(var(--tc-muted))]">Ширина (м)</label>
            <input
              type="number"
              min={0.2}
              max={3}
              step={0.05}
              value={chair.widthM}
              onChange={(e) => onPatchChair({ widthM: Number(e.target.value) || 0.2 })}
              className={`w-24 ${inputCls}`}
            />
          </div>
          <div>
            <label className="mb-0.5 block text-xs text-[rgb(var(--tc-muted))]">Глубина (м)</label>
            <input
              type="number"
              min={0.2}
              max={3}
              step={0.05}
              value={chair.heightM}
              onChange={(e) => onPatchChair({ heightM: Number(e.target.value) || 0.2 })}
              className={`w-24 ${inputCls}`}
            />
          </div>
        </>
      )}

      {focus.type === 'window' && win && moveMode && (
        <>
          <div>
            <label className="mb-0.5 block text-xs text-[rgb(var(--tc-muted))]">Название</label>
            <input
              type="text"
              value={win.name}
              onChange={(e) => onPatchWindow({ name: e.target.value })}
              className={`w-36 ${inputCls}`}
            />
          </div>
          <div>
            <label className="mb-0.5 block text-xs text-[rgb(var(--tc-muted))]">
              Ширина проёма (м)
            </label>
            <input
              type="number"
              min={0.3}
              max={5}
              step={0.05}
              value={win.widthM}
              onChange={(e) => onPatchWindow({ widthM: Number(e.target.value) || 0.3 })}
              className={`w-24 ${inputCls}`}
            />
          </div>
        </>
      )}

      {focus.type === 'door' && door && moveMode && (
        <>
          <div>
            <label className="mb-0.5 block text-xs text-[rgb(var(--tc-muted))]">Название</label>
            <input
              type="text"
              value={door.name}
              onChange={(e) => onPatchDoor({ name: e.target.value })}
              className={`w-36 ${inputCls}`}
            />
          </div>
          <div>
            <label className="mb-0.5 block text-xs text-[rgb(var(--tc-muted))]">Ширина (м)</label>
            <input
              type="number"
              min={0.6}
              max={2.5}
              step={0.05}
              value={door.widthM}
              onChange={(e) => onPatchDoor({ widthM: Number(e.target.value) || 0.9 })}
              className={`w-24 ${inputCls}`}
            />
          </div>
          <div>
            <label className="mb-0.5 block text-xs text-[rgb(var(--tc-muted))]">Тип</label>
            <select
              value={door.kind}
              onChange={(e) => onPatchDoor({ kind: e.target.value as DoorKind })}
              className={inputCls}
            >
              {DOOR_KINDS.map((k) => (
                <option key={k.id} value={k.id}>
                  {k.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-0.5 block text-xs text-[rgb(var(--tc-muted))]">Открывание</label>
            <select
              value={door.swing}
              onChange={(e) => onPatchDoor({ swing: e.target.value as DoorSwing })}
              className={inputCls}
            >
              {DOOR_SWINGS.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
        </>
      )}

      {focus.type === 'fixture' && fixture && moveMode && (
        <div>
          <label className="mb-0.5 block text-xs text-[rgb(var(--tc-muted))]">
            Название на плане
          </label>
          <input
            type="text"
            value={fixture.name}
            onChange={(e) => onPatchFixture({ name: e.target.value })}
            className={`w-44 ${inputCls}`}
          />
        </div>
      )}

      {focus.type === 'stair' && stair && moveMode && (
        <div>
          <label className="mb-0.5 block text-xs text-[rgb(var(--tc-muted))]">Название</label>
          <input
            type="text"
            value={stair.name}
            onChange={(e) => onPatchStair({ name: e.target.value })}
            className={`w-36 ${inputCls}`}
          />
        </div>
      )}

      {editSubMode === 'rotate' &&
        focus.type !== 'wall' &&
        focus.type !== 'window' &&
        focus.type !== 'door' && (
          <p className="text-xs text-[rgb(var(--tc-muted))]">
            Режим поворота: тяните маркер ↻ на объекте.
          </p>
        )}
    </div>
  );
}
