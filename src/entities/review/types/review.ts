export type Review = {
  id: string;
  userId: string;
  userName: string;
  cafeId: string;
  orderId?: string;
  rating: number;
  comment?: string;
  pros?: string[];
  cons?: string[];
  photos?: string[];
  isVerified: boolean;
  verifiedAt?: string;
  createdAt: string;
  updatedAt: string;
};

export type ReviewListResponse = {
  items: Review[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};
