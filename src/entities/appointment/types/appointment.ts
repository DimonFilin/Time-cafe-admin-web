export type AppointmentStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed';
export type AppointmentPaymentMethod = 'CARD' | 'BALANCE' | 'CASH' | 'FREE';

export type Appointment = {
  id: string;
  userId: string;
  cafeId: string;
  cafeName?: string;
  dateTime: string;
  duration: number;
  status: AppointmentStatus;
  qrCode?: string;
  totalAmount?: string;
  paymentMethod?: AppointmentPaymentMethod;
  transactionId?: string;
  orderId?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
};

export type AppointmentListResponse = {
  items: Appointment[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};
