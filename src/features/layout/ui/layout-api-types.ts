export type LayoutElementRecord = {
  id?: string;
  elementType?: string;
  name?: string | null;
  geometry?: Record<string, unknown> | null;
  props?: Record<string, unknown> | null;
  roomId?: string | null;
};

export type EditorRoomRecord = {
  id?: string;
  name?: string;
  description?: string;
  capacity?: number;
  status?: string;
  imageUrl?: string;
  workingHours?: unknown;
  geometry?: unknown;
  metadata?: unknown;
};

export type EditorLayoutRecord = {
  id?: string;
  title?: string;
  schema?: unknown;
  previewUrl?: string | null;
  isPublished?: boolean;
} | null;

export type OccupancyRoomRow = {
  roomId: string;
  roomName?: string;
  capacity?: number;
  appointmentsCount?: number;
  occupancyPercent?: number;
};

export type OccupancyPayload = {
  rooms?: OccupancyRoomRow[];
  occupancyPercent?: number;
  totalCapacity?: number;
  totalAppointments?: number;
};

export type EditorStatePayload = {
  layout: EditorLayoutRecord;
  rooms: EditorRoomRecord[];
  elements: LayoutElementRecord[];
  roomAssets: Array<Record<string, unknown>>;
  sharedAssets: Array<Record<string, unknown>>;
};
