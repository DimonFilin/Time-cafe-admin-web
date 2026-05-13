import type {
  WorkersResponse,
  WorkerResponse,
  InviteWorkerDto,
  UpdateWorkerDto,
  WorkersFilters,
} from '../types/worker.types';

export async function getWorkers(filters?: WorkersFilters): Promise<WorkersResponse> {
  const params = new URLSearchParams();
  if (filters?.page) params.set('page', filters.page.toString());
  if (filters?.limit) params.set('limit', filters.limit.toString());
  if (filters?.search) params.set('search', filters.search);
  if (filters?.shiftStatus) params.set('shiftStatus', filters.shiftStatus);

  const response = await fetch(`/api/cafe-admin/workers?${params.toString()}`, {
    method: 'GET',
    credentials: 'include',
    cache: 'no-store',
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'Failed to fetch workers');
  }

  const payload = (await response.json()) as
    | WorkersResponse
    | {
        workers?: WorkerResponse[];
        total?: number;
        page?: number;
        limit?: number;
      };

  // Backward-compatible normalization: backend may return either
  // { workers, pagination } or { workers, total, page, limit }.
  if ('pagination' in payload && payload.pagination) {
    return payload as WorkersResponse;
  }

  const legacy = payload as {
    workers?: WorkerResponse[];
    total?: number;
    page?: number;
    limit?: number;
  };
  const total = typeof legacy.total === 'number' ? legacy.total : 0;
  const page = typeof legacy.page === 'number' ? legacy.page : filters?.page || 1;
  const limit = typeof legacy.limit === 'number' ? legacy.limit : filters?.limit || 20;

  return {
    workers: Array.isArray(legacy.workers) ? legacy.workers : [],
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(total / Math.max(1, limit))),
    },
  };
}

export async function getWorkerById(id: string): Promise<WorkerResponse> {
  const response = await fetch(`/api/cafe-admin/workers/${id}`, {
    method: 'GET',
    credentials: 'include',
    cache: 'no-store',
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'Failed to fetch worker');
  }

  return response.json();
}

export async function inviteWorker(data: InviteWorkerDto): Promise<WorkerResponse> {
  const response = await fetch('/api/cafe-admin/workers', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'Failed to invite worker');
  }

  return response.json();
}

export async function updateWorker(id: string, data: UpdateWorkerDto): Promise<WorkerResponse> {
  const response = await fetch(`/api/cafe-admin/workers/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'Failed to update worker');
  }

  return response.json();
}

export async function deleteWorker(id: string): Promise<void> {
  const response = await fetch(`/api/cafe-admin/workers/${id}`, {
    method: 'DELETE',
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'Failed to delete worker');
  }
}
