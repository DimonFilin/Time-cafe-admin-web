export type BrandStatus = 'PENDING' | 'ACTIVE' | 'SUSPENDED' | 'REJECTED';

export type Brand = {
  id: string;
  name: string;
  description?: string;
  website?: string;
  phone?: string;
  email?: string;
  address?: string;
  status: BrandStatus;
  isVerified: boolean;
  verifiedAt?: string | null;
  settings?: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
};
