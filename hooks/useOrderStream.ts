import { useEffect, useRef, useCallback } from 'react';
import { useOrderStore } from '@/store/orderStore';

export const useOrderStream = () => {
  const applyChange = useOrderStore((state) => state.applyChange);
  const fetchAndSetOrders = useOrderStore((state) => state.fetchAndSetOrders);
  const retryCount = useRef(0);
  const esRef = useRef<EventSource | null>(null);
  const retryTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isConnecting = useRef(false);

  const connect = useCallback(() => {
    if (isConnecting.current) return;
    isConnecting.current = true;

    // Clean up any existing connection first
    if (esRef.current) {
      esRef.current.close();
      esRef.current = null;
    }
    if (retryTimer.current) {
      clearTimeout(retryTimer.current);
      retryTimer.current = null;
    }

    const es = new EventSource('/api/orders/stream');
    esRef.current = es;

    es.onopen = () => {
      retryCount.current = 0;
      isConnecting.current = false;
    };

    es.onmessage = (e) => {
      // Ignore heartbeat comments (they come as empty or ': heartbeat')
      if (!e.data || e.data.trim() === '') return;

      try {
        const change = JSON.parse(e.data);

        if (change.operationType === 'reconnect') {
          // Server told us to reconnect — re-fetch active orders
          fetchAndSetOrders().catch(console.error);
          return;
        }

        applyChange(change);
      } catch (err) {
        console.error('SSE parse error:', err);
      }
    };

    es.onerror = () => {
      isConnecting.current = false;
      es.close();
      esRef.current = null;

      // Exponential backoff: 2s, 4s, 8s, 16s, max 30s
      const delay = Math.min(2000 * Math.pow(2, retryCount.current), 30000);
      retryCount.current = Math.min(retryCount.current + 1, 5);
      console.warn(`SSE disconnected. Reconnecting in ${delay / 1000}s (attempt ${retryCount.current})...`);

      retryTimer.current = setTimeout(connect, delay);
    };
  }, [applyChange, fetchAndSetOrders]);

  useEffect(() => {
    connect();

    return () => {
      isConnecting.current = false;
      if (retryTimer.current) clearTimeout(retryTimer.current);
      if (esRef.current) {
        esRef.current.close();
        esRef.current = null;
      }
    };
  }, [connect]);
};
