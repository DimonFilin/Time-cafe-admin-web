/** Tool catalog for the cafe layout planning screen */

export type PlanGroup = 'structure' | 'interior';

export type StructureTool = 'wall' | 'room' | 'window' | 'door' | 'stair';

export type InteriorTool =
  | 'table'
  | 'chair'
  | 'sofa'
  | 'toilet'
  | 'sink'
  | 'cabinet'
  | 'tv_wall'
  | 'tv_stand'
  | 'whiteboard';

export type ChairVariant = 'standard' | 'bar' | 'office' | 'pouf';

export type DoorKind = 'plain' | 'code_lock';

export type DoorSwing = 'out' | 'in' | 'both';

export type StairKind = 'rect' | 'round' | 'half_room';

export type SofaStyle = 'standard' | 'corner';

export const STRUCTURE_TOOLS: { id: StructureTool; label: string }[] = [
  { id: 'wall', label: 'Стена' },
  { id: 'room', label: 'Комната' },
  { id: 'window', label: 'Окно' },
  { id: 'door', label: 'Дверь' },
  { id: 'stair', label: 'Лестница' },
];

export const INTERIOR_TOOLS: { id: InteriorTool; label: string }[] = [
  { id: 'table', label: 'Стол' },
  { id: 'chair', label: 'Стул' },
  { id: 'sofa', label: 'Диван' },
  { id: 'toilet', label: 'Туалет' },
  { id: 'sink', label: 'Умывальник' },
  { id: 'cabinet', label: 'Шкаф' },
  { id: 'tv_wall', label: 'ТВ (настенный)' },
  { id: 'tv_stand', label: 'ТВ с подставкой' },
  { id: 'whiteboard', label: 'Мультиборд' },
];

export const CHAIR_VARIANTS: { id: ChairVariant; label: string }[] = [
  { id: 'standard', label: 'Обычный' },
  { id: 'bar', label: 'Барный' },
  { id: 'office', label: 'Офисный' },
  { id: 'pouf', label: 'Пуф / кресло' },
];

export const DOOR_KINDS: { id: DoorKind; label: string }[] = [
  { id: 'plain', label: 'Обычная' },
  { id: 'code_lock', label: 'С кодовым замком' },
];

export const DOOR_SWINGS: { id: DoorSwing; label: string }[] = [
  { id: 'out', label: 'Наружу' },
  { id: 'in', label: 'Внутрь' },
  { id: 'both', label: 'В обе стороны' },
];

export const STAIR_KINDS: { id: StairKind; label: string }[] = [
  { id: 'rect', label: 'Прямоугольная' },
  { id: 'round', label: 'Круглая' },
  { id: 'half_room', label: 'Половина в двух комнатах' },
];

export const SOFA_STYLES: { id: SofaStyle; label: string }[] = [
  { id: 'standard', label: 'Прямой' },
  { id: 'corner', label: 'Угловой' },
];

export const INTERIOR_SKIP_COLLISION: InteriorTool[] = ['tv_stand', 'whiteboard'];
