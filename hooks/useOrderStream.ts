import { useEffect } from 'react';
import { useOrderStore } from '@/store/orderStore';

export const useOrderStream = () => {
  const applyChange = useOrderStore((state) => state.applyChange);

  useEffect(() => {
    const es = new EventSource('/api/orders/stream');

    es.onmessage = (e) => {
      try {
        const change = JSON.parse(e.data);
        applyChange(change);
      } catch (err) {
        console.error('Failed to parse SSE message:', err);
      }
    };

    es.onerror = (e) => {
      console.error('SSE connection error:', e);
      es.close();
      // Reconnect logic as per rule 11
      setTimeout(() => {
        window.location.reload();
      }, 5000);
    };

    return () => {
      es.close();
    };
  }, [applyChange]);
};
