import { clientFetch } from '@/shared/lib/client-fetch';
import { t } from '@/i18n';

export interface ChatAttachment {
  id: string;
  url: string;
  mimeType: string;
  size: number;
  sortOrder: number;
}

export interface ChatAuthorWorker {
  id: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string | null;
  cafeName?: string | null;
}

export interface ChatMessage {
  id: string;
  chatId: string;
  authorType: 'USER' | 'WORKER';
  authorUserId?: string | null;
  authorWorkerId?: string | null;
  authorWorker?: ChatAuthorWorker | null;
  messageType: 'TEXT' | 'IMAGE' | 'MIXED' | 'SYSTEM';
  text?: string | null;
  attachments: ChatAttachment[];
  createdAt: string;
}

export interface ChatSummary {
  id: string;
  orderId: string;
  cafeId: string;
  userId: string;
  isEnabled: boolean;
  notificationMode: 'ALL_WORKERS' | 'ROLE_BASED' | 'SPECIFIC_WORKERS';
  unreadCount: number;
  lastMessage?: ChatMessage | null;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string | null;
    avatarUrl?: string | null;
  };
  order?: {
    id: string;
    orderNumber?: string | null;
    status?: string;
    totalAmount?: string | null;
    createdAt: string;
    appointmentId?: string | null;
  };
  appointment?: {
    id: string;
    dateTime: string;
    duration: number;
    status: string;
    notes?: string | null;
    orders: Array<{
      id: string;
      orderNumber?: string | null;
      status?: string;
      totalAmount?: string | null;
      createdAt: string;
    }>;
  } | null;
  updatedAt: string;
}

export interface ChatListResponse {
  items: ChatSummary[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ChatMessagesResponse {
  items: ChatMessage[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const chatsApi = {
  list(params: {
    search?: string;
    unreadOnly?: boolean;
    page?: number;
    limit?: number;
    cafeId?: string;
    status?: 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';
    from?: string;
    to?: string;
  }) {
    const sp = new URLSearchParams();
    if (params.search) sp.set('search', params.search);
    if (params.unreadOnly) sp.set('unreadOnly', 'true');
    if (params.page) sp.set('page', String(params.page));
    if (params.limit) sp.set('limit', String(params.limit));
    if (params.cafeId) sp.set('cafeId', params.cafeId);
    if (params.status) sp.set('status', params.status);
    if (params.from) sp.set('from', params.from);
    if (params.to) sp.set('to', params.to);
    return clientFetch<ChatListResponse>(`/api/order-chats?${sp.toString()}`);
  },

  getByOrder(orderId: string) {
    return clientFetch<ChatSummary>(`/api/order-chats/by-order/${orderId}`);
  },

  getMessages(chatId: string) {
    return clientFetch<ChatMessagesResponse>(`/api/order-chats/${chatId}/messages?limit=100`);
  },

  async upload(chatId: string, file: File) {
    const fd = new FormData();
    fd.append('file', file);
    const response = await fetch(`/api/order-chats/${chatId}/uploads`, {
      method: 'POST',
      credentials: 'include',
      body: fd,
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: t('apiErrors.uploadFailed') }));
      throw new Error(error.message || t('apiErrors.uploadFailed'));
    }
    return response.json();
  },

  sendMessage(chatId: string, payload: { text?: string; attachmentIds?: string[] }) {
    return clientFetch<ChatMessage>(`/api/order-chats/${chatId}/messages`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  markRead(chatId: string, messageId: string) {
    return clientFetch<{ ok: boolean }>(`/api/order-chats/${chatId}/messages/${messageId}/read`, {
      method: 'POST',
      body: JSON.stringify({ messageId }),
    });
  },
};
