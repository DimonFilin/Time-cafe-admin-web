export type WorkerRole = 'SYSTEM_ADMIN' | 'BRAND_ADMIN' | 'CAFE_ADMIN' | 'WORKER';

export type WorkerProfile = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: WorkerRole;
  brandId?: string;
  cafeId?: string;
  createdAt: string;
};

export type WorkerListResponse = {
  items: WorkerProfile[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};
