export interface WorkerResponse {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'WORKER';
  cafeId: string;
  brandId: string;
  balance: string;
  shiftStatus: 'ON_SHIFT' | 'OFF_SHIFT';
  createdAt: string;
  lastActivityAt?: string;
  deletedAt?: string;
}

export interface InviteWorkerDto {
  email: string;
  firstName: string;
  lastName: string;
  password: string;
}

export interface UpdateWorkerDto {
  firstName?: string;
  lastName?: string;
  email?: string;
  password?: string;
}

export interface WorkersResponse {
  workers: WorkerResponse[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface WorkersFilters {
  page?: number;
  limit?: number;
  search?: string;
  shiftStatus?: 'ON_SHIFT' | 'OFF_SHIFT';
}
