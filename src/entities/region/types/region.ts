export interface Region {
  id: string;
  name: string;
  country: string;
  createdAt: string;
  updatedAt: string;
}

export interface RegionListResponse {
  items: Region[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CreateRegionData {
  name: string;
  country: string;
}

export interface UpdateRegionData {
  name?: string;
  country?: string;
}

export interface RegionListQuery {
  page?: number;
  limit?: number;
}
