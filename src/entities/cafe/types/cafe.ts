export type CafeListItem = {
  id: string;
  name: string;
  address: string;
  city: string;
  latitude: number;
  longitude: number;
  photos: string[];
  rating: number;
  reviewsCount: number;
  brandId: string;
  brandName?: string;
  distance?: number;
};

export type CafeListResponse = {
  items: CafeListItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export type Cafe = {
  id: string;
  name: string;
  description?: string;
  address: string;
  city: string;
  street?: string;
  latitude: number;
  longitude: number;
  photos: string[];
  brandId: string;
  regionId: string;
  cafeApiUrl?: string;
  createdAt: string;
  updatedAt: string;
};
