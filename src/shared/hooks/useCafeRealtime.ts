'use client';

import { useEffect } from 'react';
import { connectAdminSocket } from '@/shared/lib/admin-socket';

type CafeRealtimeHandlers = {
  onOrderUpdated?: () => void;
  onAppointmentUpdated?: () => void;
};

export function useCafeRealtime(cafeId: string | undefined, handlers: CafeRealtimeHandlers) {
  const onOrderUpdated = handlers.onOrderUpdated;
  const onAppointmentUpdated = handlers.onAppointmentUpdated;

  useEffect(() => {
    if (!cafeId) return;

    let disposed = false;
    let socket: Awaited<ReturnType<typeof connectAdminSocket>> = null;

    void (async () => {
      socket = await connectAdminSocket('/cafe-realtime');
      if (!socket || disposed) {
        socket?.disconnect();
        return;
      }

      const join = () => {
        socket?.emit('cafe:join', { cafeId });
      };

      socket.on('connect', join);
      socket.on('order:updated', () => onOrderUpdated?.());
      socket.on('appointment:updated', () => onAppointmentUpdated?.());

      if (socket.connected) join();
    })();

    return () => {
      disposed = true;
      socket?.disconnect();
    };
  }, [cafeId, onOrderUpdated, onAppointmentUpdated]);
}
