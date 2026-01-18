export interface User {
  id: string;
  keycloakId: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string | null;
  avatar?: string | null;
  balance: number;
  deletedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UserListResponse {
  items: User[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CreateUserData {
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
}

export interface UpdateUserData {
  firstName?: string;
  lastName?: string;
  phone?: string;
  avatar?: string;
  balanceDelta?: number;
}

export interface UserListQuery {
  page?: number;
  limit?: number;
  email?: string;
  firstName?: string;
  includeDeleted?: boolean;
}
