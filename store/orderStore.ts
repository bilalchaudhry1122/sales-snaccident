import { create } from 'zustand';

interface Order {
  _id: string;
  orderNumber: string;
  customerName: string;
  status: string;
  totalAmount: number;
  items: any[];
  placedAt: string;
}

interface OrderState {
  orders: Map<string, Order>;
  setOrders: (orders: Order[]) => void;
  applyChange: (change: any) => void;
}

export const useOrderStore = create<OrderState>((set) => ({
  orders: new Map(),
  setOrders: (orders) => set({
    orders: new Map(orders.map(o => [o._id, o]))
  }),
  applyChange: (change) => set((state) => {
    const newOrders = new Map(state.orders);
    
    if (change.operationType === 'insert') {
      newOrders.set(change.fullDocument._id, change.fullDocument);
    } else if (change.operationType === 'update') {
      const existing = newOrders.get(change.documentKey._id);
      if (existing) {
        newOrders.set(change.documentKey._id, { ...existing, ...change.updateDescription.updatedFields });
      }
    } else if (change.operationType === 'delete' || change.updateDescription?.updatedFields?.status === 'delivered' || change.updateDescription?.updatedFields?.status === 'cancelled' || change.updateDescription?.updatedFields?.status === 'failed') {
      // For Counter B, we might want to remove delivered/cancelled/failed orders from the live view
      newOrders.delete(change.documentKey._id);
    }
    
    return { orders: newOrders };
  })
}));
