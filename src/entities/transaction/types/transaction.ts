export enum TransactionType {
  PAYMENT = 'PAYMENT',
  REFUND = 'REFUND',
}

export enum TransactionStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
}

export interface Transaction {
  id: string;
  userId: string;
  type: TransactionType;
  status: TransactionStatus;
  amount: string;
  currency: string;
  orderId?: string | null;
  cardId?: string | null;
  provider?: string | null;
  providerTransactionId?: string | null;
  description?: string | null;
  createdAt: string;
  user?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
  card?: {
    id: string;
    last4Digits: string;
    cardType: string;
  };
  order?: {
    id: string;
    orderNumber: string;
    status: string;
  };
}

export interface TransactionListResponse {
  items: Transaction[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface TransactionListQuery {
  page?: number;
  limit?: number;
  userId?: string;
  type?: TransactionType;
  status?: TransactionStatus;
  orderId?: string;
}

export interface CreateRefundData {
  amount?: number;
  description?: string;
}
