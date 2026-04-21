export interface CafeMenuItem {
  id: string;
  key: string;
  categoryId: string;
  name: string;
  description?: string | null;
  price: string; // decimal as string
  currency: string;
  photoUrl?: string | null;
  sortOrder: number;
  isActive: boolean;
}

export interface CafeMenuCategory {
  id: string;
  key: string;
  name: string;
  description?: string | null;
  sortOrder: number;
  isActive: boolean;
  items: CafeMenuItem[];
}

export interface CafeMenuResponse {
  cafeId: string;
  categories: CafeMenuCategory[];
}

export interface CafeMenuJsonV1 {
  version?: 1;
  cafeId?: string;
  generatedAt?: string;
  categories: Array<{
    key: string;
    name: string;
    description?: string | null;
    sortOrder?: number;
    isActive?: boolean;
  }>;
  items: Array<{
    key: string;
    categoryKey: string;
    name: string;
    description?: string | null;
    price: number;
    currency?: string;
    photoUrl?: string | null;
    sortOrder?: number;
    isActive?: boolean;
  }>;
}
