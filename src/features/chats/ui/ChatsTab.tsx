'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { MediaImage } from '@/shared/ui/media/MediaImage';
import { proxiedMediaUrl } from '@/shared/lib/proxied-media-url';
import { chatsApi, ChatMessage, ChatSummary } from '../api/chats-api';

const wsUrl = process.env.NEXT_PUBLIC_SHARED_API_URL || 'http://localhost:3000';
type ChatStatusFilter = 'ALL' | 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';

export function ChatsTab() {
  const [search, setSearch] = useState('');
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [statusFilter, setStatusFilter] = useState<ChatStatusFilter>('ALL');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [chats, setChats] = useState<ChatSummary[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState('');
  const [uploading, setUploading] = useState(false);
  const [attachmentIds, setAttachmentIds] = useState<string[]>([]);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const [userInfoOpen, setUserInfoOpen] = useState(false);
  const [appointmentOrdersOpen, setAppointmentOrdersOpen] = useState(false);
  const activeChatIdRef = useRef<string | null>(null);
  const messagesScrollRef = useRef<HTMLDivElement | null>(null);
  const shouldAutoScrollRef = useRef(true);

  const appendUniqueMessage = (list: ChatMessage[], next: ChatMessage) => {
    if (list.some((m) => m.id === next.id)) {
      return list;
    }
    return [...list, next];
  };

  const activeChat = useMemo(
    () => chats.find((chat) => chat.id === activeChatId) || null,
    [activeChatId, chats],
  );
  const activeCustomerName = useMemo(() => {
    if (!activeChat?.user) return 'Пользователь';
    const full = `${activeChat.user.firstName || ''} ${activeChat.user.lastName || ''}`.trim();
    return full || activeChat.user.email || 'Пользователь';
  }, [activeChat]);

  const loadChats = useCallback(async () => {
    const data = await chatsApi.list({
      search,
      unreadOnly,
      limit: 100,
      status: statusFilter === 'ALL' ? undefined : statusFilter,
      from: fromDate || undefined,
      to: toDate || undefined,
    });
    setChats(data.items);
    setActiveChatId((prev) => prev ?? data.items[0]?.id ?? null);
  }, [search, unreadOnly, statusFilter, fromDate, toDate]);

  useEffect(() => {
    void loadChats();
  }, [loadChats]);

  const loadChatsRef = useRef(loadChats);
  loadChatsRef.current = loadChats;

  useEffect(() => {
    if (!activeChatId) return;
    chatsApi.getMessages(activeChatId).then((res) => {
      setMessages([...res.items].reverse());
      const last = res.items[0];
      if (last) {
        void chatsApi.markRead(activeChatId, last.id);
      }
    });
  }, [activeChatId]);

  useEffect(() => {
    activeChatIdRef.current = activeChatId;
  }, [activeChatId]);

  useEffect(() => {
    const el = messagesScrollRef.current;
    if (!el) return;
    if (!shouldAutoScrollRef.current) return;
    el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    let disposed = false;
    const s = io(`${wsUrl}/order-chats`, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      withCredentials: true,
    });
    s.on('chat:message:new', (message: ChatMessage) => {
      if (message.chatId === activeChatIdRef.current) {
        setMessages((prev) => appendUniqueMessage(prev, message));
      }
      void loadChatsRef.current();
    });
    s.on('chat:unread:update', () => {
      void loadChatsRef.current();
    });
    if (!disposed) {
      setSocket(s);
    }

    return () => {
      disposed = true;
      s.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!socket || !activeChatId) return;
    socket.emit('chat:join', { chatId: activeChatId });
    return () => {
      socket.emit('chat:leave', { chatId: activeChatId });
    };
  }, [socket, activeChatId]);

  const handleUpload = async (files: FileList | null) => {
    if (!files || !activeChatId) return;
    const picked = Array.from(files).slice(0, Math.max(0, 4 - attachmentIds.length));
    if (!picked.length) return;
    setUploading(true);
    try {
      const uploaded = await Promise.all(picked.map((file) => chatsApi.upload(activeChatId, file)));
      setAttachmentIds((prev) => [...prev, ...uploaded.map((u) => u.id)].slice(0, 4));
    } catch (err) {
      console.error('[ChatsTab] upload failed', err);
    } finally {
      setUploading(false);
    }
  };

  const send = async () => {
    if (!activeChatId) return;
    const payload = { text: text.trim() || undefined, attachmentIds };
    if (!payload.text && attachmentIds.length === 0) return;
    const created = await chatsApi.sendMessage(activeChatId, payload);
    setMessages((prev) => appendUniqueMessage(prev, created));
    setText('');
    setAttachmentIds([]);
    await loadChats();
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[340px,1fr]">
      <div className="rounded-xl border border-[rgb(var(--tc-border))]">
        <div className="space-y-2 border-b border-[rgb(var(--tc-border))] p-3">
          <input
            className="w-full rounded-md border border-[rgb(var(--tc-border))] bg-transparent px-3 py-2 text-sm"
            placeholder="Поиск по сообщениям"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <label className="flex items-center gap-2 text-sm text-[rgb(var(--tc-muted))]">
            <input
              type="checkbox"
              checked={unreadOnly}
              onChange={(e) => setUnreadOnly(e.target.checked)}
            />
            Только непрочитанные
          </label>
          <div className="grid grid-cols-3 gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as ChatStatusFilter)}
              className="rounded-md border border-[rgb(var(--tc-border))] bg-transparent px-2 py-1 text-xs"
            >
              <option value="ALL">Все статусы</option>
              <option value="PENDING">PENDING</option>
              <option value="CONFIRMED">CONFIRMED</option>
              <option value="COMPLETED">COMPLETED</option>
              <option value="CANCELLED">CANCELLED</option>
            </select>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="rounded-md border border-[rgb(var(--tc-border))] bg-transparent px-2 py-1 text-xs"
            />
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="rounded-md border border-[rgb(var(--tc-border))] bg-transparent px-2 py-1 text-xs"
            />
          </div>
        </div>
        <div className="max-h-[65vh] overflow-auto">
          {chats.map((chat) => (
            <button
              key={chat.id}
              onClick={() => setActiveChatId(chat.id)}
              className={`w-full border-b border-[rgb(var(--tc-border))] p-3 text-left ${
                chat.id === activeChatId ? 'bg-[rgb(var(--tc-accent))]/10' : ''
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="font-medium">Order #{chat.orderId.slice(0, 8)}</div>
                {chat.unreadCount > 0 && (
                  <span className="rounded-full bg-[rgb(var(--tc-accent))] px-2 py-0.5 text-xs text-white">
                    {chat.unreadCount}
                  </span>
                )}
              </div>
              <div className="mt-1 line-clamp-2 text-xs text-[rgb(var(--tc-muted))]">
                {chat.lastMessage?.text || 'Фото/вложение'}
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="flex h-[72vh] min-h-[65vh] flex-col rounded-xl border border-[rgb(var(--tc-border))]">
        <div className="border-b border-[rgb(var(--tc-border))] p-3 font-medium">
          {activeChat ? (
            <div className="flex items-center justify-between gap-3">
              <div>Чат заказа #{activeChat.orderId.slice(0, 8)}</div>
              {activeChat.user ? (
                <button
                  type="button"
                  onClick={() => {
                    setAppointmentOrdersOpen(false);
                    setUserInfoOpen(true);
                  }}
                  className="flex items-center gap-2 rounded-full border border-[rgb(var(--tc-border))] px-2 py-1 text-sm hover:bg-[rgb(var(--tc-bg-soft))]"
                >
                  {activeChat.user.avatarUrl ? (
                    <MediaImage
                      src={activeChat.user.avatarUrl}
                      alt={activeCustomerName}
                      variant="avatarXs"
                    />
                  ) : (
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[rgb(var(--tc-accent))] text-xs font-semibold text-white">
                      {activeCustomerName.slice(0, 1).toUpperCase()}
                    </div>
                  )}
                  <span className="max-w-[210px] truncate">{activeCustomerName}</span>
                </button>
              ) : null}
            </div>
          ) : (
            'Выберите чат'
          )}
        </div>
        <div
          ref={messagesScrollRef}
          className="flex-1 space-y-2 overflow-auto p-3"
          onScroll={(e) => {
            const el = e.currentTarget;
            const distanceToBottom = el.scrollHeight - (el.scrollTop + el.clientHeight);
            shouldAutoScrollRef.current = distanceToBottom < 80;
          }}
        >
          {messages.map((m) => {
            const isWorker = m.authorType === 'WORKER';
            return (
              <div key={m.id} className={`flex ${isWorker ? 'justify-end' : 'justify-start'}`}>
                {!isWorker ? (
                  <button
                    type="button"
                    onClick={() => {
                      setAppointmentOrdersOpen(false);
                      setUserInfoOpen(true);
                    }}
                    className="mr-2 mt-1 h-8 w-8 shrink-0"
                    title={activeCustomerName}
                  >
                    {activeChat?.user?.avatarUrl ? (
                      <MediaImage
                        src={activeChat.user.avatarUrl}
                        alt={activeCustomerName}
                        variant="avatarSm"
                      />
                    ) : (
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[rgb(var(--tc-accent))] text-xs font-semibold text-white">
                        {activeCustomerName.slice(0, 1).toUpperCase()}
                      </div>
                    )}
                  </button>
                ) : null}
                <div
                  className={`max-w-[85%] rounded-xl p-3 ${isWorker ? 'bg-[rgb(var(--tc-accent))] text-white' : 'bg-[rgb(var(--tc-bg-soft))]'}`}
                >
                  <div
                    className={`mb-1 text-[11px] ${isWorker ? 'text-white/80' : 'text-[rgb(var(--tc-muted))]'}`}
                  >
                    {isWorker ? 'Вы' : activeCustomerName}
                  </div>
                  {m.text && <div className="text-sm">{m.text}</div>}
                  {!!m.attachments.length && (
                    <div className="mt-2 grid grid-cols-2 gap-2">
                      {m.attachments.map((a) => (
                        <button key={a.id} type="button" onClick={() => setPreviewImageUrl(a.url)}>
                          <MediaImage src={a.url} alt="Вложение" variant="attachment" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        <div className="space-y-2 border-t border-[rgb(var(--tc-border))] p-3">
          <div className="flex items-center justify-between text-xs text-[rgb(var(--tc-muted))]">
            <span>Вложений: {attachmentIds.length}/4</span>
            {uploading && <span>Загрузка...</span>}
          </div>
          <div className="flex items-center gap-2">
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              disabled={!activeChatId || uploading}
              onChange={(e) => void handleUpload(e.target.files)}
            />
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Введите сообщение"
              className="flex-1 rounded-md border border-[rgb(var(--tc-border))] bg-transparent px-3 py-2 text-sm"
            />
            <button
              onClick={() => void send()}
              disabled={uploading || (!text.trim() && attachmentIds.length === 0)}
              className="rounded-md bg-[rgb(var(--tc-accent))] px-4 py-2 text-sm text-white disabled:opacity-60"
            >
              Отправить
            </button>
          </div>
        </div>
      </div>
      {previewImageUrl ? (
        <button
          type="button"
          onClick={() => setPreviewImageUrl(null)}
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 p-4"
        >
          <div className="relative w-full max-w-3xl" onClick={(e) => e.stopPropagation()}>
            <MediaImage src={previewImageUrl} alt="Просмотр" variant="preview" />
            <a
              href={proxiedMediaUrl(previewImageUrl) || previewImageUrl || '#'}
              target="_blank"
              rel="noreferrer"
              download
              className="absolute bottom-[-14px] right-3 rounded-t-2xl rounded-b-xl bg-[rgb(var(--tc-accent))] px-4 py-2 text-sm font-semibold text-white shadow-lg"
            >
              Скачать
            </a>
          </div>
        </button>
      ) : null}
      {userInfoOpen && activeChat?.user ? (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-xl rounded-2xl border border-[rgb(var(--tc-border))] bg-[rgb(var(--tc-bg))] p-4">
            <div className="mb-4 flex items-start justify-between">
              <div className="flex items-center gap-3">
                {activeChat.user.avatarUrl ? (
                  <MediaImage
                    src={activeChat.user.avatarUrl}
                    alt={activeCustomerName}
                    variant="avatarMd"
                  />
                ) : (
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[rgb(var(--tc-accent))] text-lg font-semibold text-white">
                    {activeCustomerName.slice(0, 1).toUpperCase()}
                  </div>
                )}
                <div>
                  <div className="font-semibold">{activeCustomerName}</div>
                  <div className="text-sm text-[rgb(var(--tc-muted))]">{activeChat.user.email}</div>
                </div>
              </div>
              <button
                type="button"
                className="rounded-md border border-[rgb(var(--tc-border))] px-2 py-1 text-sm"
                onClick={() => setUserInfoOpen(false)}
              >
                Закрыть
              </button>
            </div>

            <div className="space-y-2 text-sm">
              <div>
                <span className="text-[rgb(var(--tc-muted))]">Телефон: </span>
                {activeChat.user.phone || '—'}
              </div>
              {activeChat.appointment ? (
                <div className="rounded-lg border border-[rgb(var(--tc-border))] p-3">
                  <div className="font-medium">Бронирование</div>
                  <div className="mt-1 text-[rgb(var(--tc-muted))]">
                    #{activeChat.appointment.id.slice(0, 8)} ·{' '}
                    {new Date(activeChat.appointment.dateTime).toLocaleString()} ·{' '}
                    {activeChat.appointment.duration} мин · {activeChat.appointment.status}
                  </div>
                  {activeChat.appointment.notes ? (
                    <div className="mt-1 text-[rgb(var(--tc-muted))]">
                      Заметка: {activeChat.appointment.notes}
                    </div>
                  ) : null}

                  {activeChat.appointment.orders.length > 0 ? (
                    <div className="mt-3">
                      <button
                        type="button"
                        onClick={() => setAppointmentOrdersOpen((prev) => !prev)}
                        className="rounded-md border border-[rgb(var(--tc-border))] px-3 py-1 text-xs"
                      >
                        {appointmentOrdersOpen ? 'Скрыть' : 'Показать'} связанные заказы (
                        {activeChat.appointment.orders.length})
                      </button>
                      {appointmentOrdersOpen ? (
                        <div className="mt-2 space-y-2">
                          {activeChat.appointment.orders.map((o) => (
                            <div
                              key={o.id}
                              className="rounded-md border border-[rgb(var(--tc-border))] p-2 text-xs"
                            >
                              <div className="font-medium">
                                Заказ #{o.orderNumber || o.id.slice(0, 8)}
                              </div>
                              <div className="text-[rgb(var(--tc-muted))]">
                                Статус: {o.status || '—'} · Сумма: {o.totalAmount || '—'} ·{' '}
                                {new Date(o.createdAt).toLocaleString()}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              ) : (
                <div className="rounded-lg border border-[rgb(var(--tc-border))] p-3 text-[rgb(var(--tc-muted))]">
                  Бронирование не найдено
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
