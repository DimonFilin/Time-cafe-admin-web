export type OrderStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';
export type DeliveryType = 'IN_CAFE' | 'TAKEOUT' | 'DELIVERY';
export type PaymentMethod = 'CARD' | 'BALANCE' | 'CASH';

export type OrderItem = {
  id: string;
  itemName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
};

export type Order = {
  id: string;
  orderNumber: string;
  userId: string;
  cafeId: string;
  cafeName?: string;
  appointmentId?: string;
  status: OrderStatus;
  totalAmount: number;
  deliveryType: DeliveryType;
  deliveryAddress?: string;
  contactPhone: string;
  notes?: string;
  paymentMethod: PaymentMethod;
  paidAt?: string;
  confirmedAt?: string;
  completedAt?: string;
  cancelledAt?: string;
  cancellationReason?: string;
  items: OrderItem[];
  createdAt: string;
  updatedAt: string;
};

export type OrderListResponse = {
  items: Order[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};
