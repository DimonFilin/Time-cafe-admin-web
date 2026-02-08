export interface WorkerWithRelations {
  id: string;
  firstName: string;
  lastName: string;
  cafeId: string | null;
  brandId: string;
  shiftStatus: 'ON_SHIFT' | 'OFF_SHIFT';
  cafe?: {
    id: string;
    name: string;
  } | null;
  brand?: {
    id: string;
    name: string;
  };
}
