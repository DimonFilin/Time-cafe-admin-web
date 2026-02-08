export type OrderStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';
export type DeliveryType = 'IN_CAFE' | 'TAKEOUT' | 'DELIVERY';
export type PaymentMethod = 'CARD' | 'BALANCE' | 'CASH';

export interface OrderItem {
  id: string;
  itemName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  notes?: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  totalAmount: number;
  deliveryType: DeliveryType;
  deliveryAddress?: string;
  contactPhone?: string;
  notes?: string;
  paymentMethod: PaymentMethod;
  createdAt: string;
  confirmedAt?: string;
  completedAt?: string;
  cancelledAt?: string;
  cancellationReason?: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    phone?: string;
  };
  items: OrderItem[];
}

export interface OrdersResponse {
  orders: Order[];
  total: number;
}

export interface ConfirmOrderDto {
  orderId: string;
  cafeId: string;
}

export interface CompleteOrderDto {
  orderId: string;
  cafeId: string;
}

export interface CancelOrderDto {
  orderId: string;
  cafeId: string;
  reason: string;
}
