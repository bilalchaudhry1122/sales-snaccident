import { create } from 'zustand';

export interface Order {
  _id: string;
  orderNumber: string;
  customerName: string;
  status: string;
  totalAmount: number;
  subtotal: number;
  items: any[];
  placedAt: string;
  orderDiscount?: any;
  cancellationReason?: string;
  [key: string]: any;
}

interface OrderState {
  orders: Map<string, Order>;
  isLoading: boolean;
  setOrders: (orders: Order[]) => void;
  upsertOrder: (order: Order) => void;
  upsertOrders: (orders: Order[]) => void;
  removeOrder: (id: string) => void;
  applyChange: (change: any) => void;
  fetchAndSetOrders: (params?: { status?: string; limit?: number; page?: number }) => Promise<any>;
}

/** Safely convert an ObjectId or string to a plain string key */
const toKey = (id: any): string => (id?.toString ? id.toString() : String(id));

export const useOrderStore = create<OrderState>((set, get) => ({
  orders: new Map(),
  isLoading: false,

  setOrders: (orders) =>
    set({ orders: new Map(orders.map((o) => [toKey(o._id), o])) }),

  upsertOrder: (order) =>
    set((state) => {
      const next = new Map(state.orders);
      next.set(toKey(order._id), order);
      return { orders: next };
    }),

  removeOrder: (id) =>
    set((state) => {
      const next = new Map(state.orders);
      next.delete(toKey(id));
      return { orders: next };
    }),

  applyChange: (change) =>
    set((state) => {
      const next = new Map(state.orders);
      const docId = change.documentKey?._id ? toKey(change.documentKey._id) : null;

      switch (change.operationType) {
        case 'insert':
          if (change.fullDocument) {
            next.set(toKey(change.fullDocument._id), change.fullDocument);
          }
          break;

        case 'update':
          if (change.fullDocument) {
            // Full document available — most reliable path
            const id = toKey(change.fullDocument._id ?? change.documentKey?._id);
            next.set(id, change.fullDocument);
          } else if (docId && change.updateDescription?.updatedFields) {
            // Partial merge fallback
            const existing = next.get(docId);
            if (existing) {
              next.set(docId, { ...existing, ...change.updateDescription.updatedFields });
            }
          }
          break;

        case 'delete':
          if (docId) next.delete(docId);
          break;

        case 'replace':
          if (change.fullDocument) {
            next.set(toKey(change.fullDocument._id), change.fullDocument);
          }
          break;

        default:
          break;
      }

      return { orders: next };
    }),

  upsertOrders: (newOrders) =>
    set((state) => {
      const next = new Map(state.orders);
      newOrders.forEach(o => next.set(toKey(o._id), o));
      return { orders: next };
    }),

  fetchAndSetOrders: async (params = {}) => {
    const { status, limit = 100, page = 1 } = params;
    set({ isLoading: true });
    try {
      const qs = new URLSearchParams();
      if (status) qs.set('status', status);
      qs.set('limit', String(limit));
      qs.set('page', String(page));

      const res = await fetch(`/api/orders?${qs.toString()}`);
      if (!res.ok) {
        console.error('fetchAndSetOrders failed:', res.status);
        return null;
      }
      const data = await res.json();
      const orders: Order[] = Array.isArray(data) ? data : (data.orders ?? []);
      
      if (page === 1) {
        get().setOrders(orders);
      } else {
        get().upsertOrders(orders);
      }

      return data.pagination || null;
    } catch (err) {
      console.error('fetchAndSetOrders error:', err);
      return null;
    } finally {
      set({ isLoading: false });
    }
  },
}));
