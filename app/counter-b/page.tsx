"use client";

import { useState, useEffect, useMemo } from "react";
import { useOrderStore } from "@/store/orderStore";
import { useOrderStream } from "@/hooks/useOrderStream";
import { Button } from "@/components/ui/button";
import {
  CheckCircle2,
  Clock,
  User,
  Loader2,
  LogOut,
  Search,
  ChefHat,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

const STATUS_STYLES: Record<string, { label: string; bg: string; text: string; dot: string }> = {
  pending:   { label: "Pending",   bg: "bg-amber-100",   text: "text-amber-800",  dot: "bg-amber-500" },
  preparing: { label: "Preparing", bg: "bg-indigo-100",  text: "text-indigo-800", dot: "bg-indigo-600" },
  ready:     { label: "Ready",     bg: "bg-emerald-100", text: "text-emerald-800", dot: "bg-emerald-600" },
};

export default function CounterBPage() {
  useOrderStream();
  const ordersMap = useOrderStore((state) => state.orders);
  const fetchAndSetOrders = useOrderStore((state) => state.fetchAndSetOrders);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [delivering, setDelivering] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        await fetchAndSetOrders({ limit: 100 });
      } catch (err) {
        console.error("Failed to fetch orders:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, [fetchAndSetOrders]);

  const deliverOrder = async (id: string) => {
    setDelivering(id);
    try {
      const res = await fetch(`/api/orders/${id}/deliver`, {
        method: "PATCH",
      });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "Failed to deliver order");
      }
    } catch {
      alert("Error delivering order. Please try again.");
    } finally {
      setDelivering(null);
    }
  };



  // All active orders sorted oldest-first (queue order)
  const orderQueue = useMemo(() => {
    return Array.from(ordersMap.values())
      .filter((order) => {
        const isActive = ["pending", "preparing", "ready"].includes(order.status);
        const matchesSearch =
          order.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase());
        return isActive && matchesSearch;
      })
      .sort((a, b) => new Date(a.placedAt).getTime() - new Date(b.placedAt).getTime());
  }, [ordersMap, searchQuery]);

  const activeCount = useMemo(() => orderQueue.length, [orderQueue]);

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-slate-50">
      {/* Header */}
      <header className="h-16 flex items-center justify-between px-4 sm:px-8 flex-shrink-0 bg-white border-b border-slate-100 shadow-sm">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)" }}
          >
            <ChefHat className="h-5 w-5 text-white" strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-base font-black text-slate-900 leading-none">Cooking Station</h1>
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Snaccident Sales</span>
          </div>
        </div>

        {/* Stats bar */}
        <div className="hidden md:flex items-center gap-4">
          <div className="flex items-center gap-2 bg-indigo-50 border border-indigo-100 rounded-xl px-4 py-2">
            <ChefHat className="h-3.5 w-3.5 text-indigo-600" strokeWidth={2.5} />
            <span className="text-xs font-black text-indigo-700 uppercase tracking-wider">{activeCount} Active Orders</span>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <div className="relative w-32 sm:w-56">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              placeholder="Search orders..."
              className="w-full pl-10 pr-4 h-9 rounded-xl text-sm font-black outline-none focus:ring-2 focus:ring-indigo-500/40 transition-all border border-slate-200 bg-white text-slate-900"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <a
            href="/api/auth/signout"
            className="flex items-center gap-1.5 h-9 px-3 rounded-xl text-sm font-black transition-all text-slate-500 border border-slate-200 hover:text-red-600 hover:bg-red-50 hover:border-red-200"
          >
            <LogOut className="h-4 w-4" strokeWidth={2.5} />
            <span className="hidden sm:inline">Sign Out</span>
          </a>
        </div>
      </header>

      {/* Main Deliver Queue */}
      <main className="flex-1 overflow-y-auto p-6">
        {loading ? (
          <div className="flex-1 flex items-center justify-center h-full">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="h-10 w-10 animate-spin text-indigo-500" />
              <p className="text-sm font-black text-slate-400 uppercase tracking-widest">Loading orders...</p>
            </div>
          </div>
        ) : orderQueue.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="w-20 h-20 rounded-3xl bg-white border border-slate-100 shadow-md flex items-center justify-center">
                <ChefHat className="h-10 w-10 text-slate-200" strokeWidth={1.5} />
              </div>
              <p className="text-2xl font-black text-slate-300 uppercase tracking-[0.2em]">Queue Empty</p>
              <p className="text-sm font-black text-slate-300">No active orders right now.</p>
            </div>
          </div>
        ) : (
          <div className="grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
            {orderQueue.map((order, index) => {
              const elapsedMs = new Date().getTime() - new Date(order.placedAt).getTime();
              const isUrgent = elapsedMs > 600000; // >10 min
              const isWarning = elapsedMs > 300000; // >5 min
              const statusStyle = STATUS_STYLES[order.status] || STATUS_STYLES.pending;
              const isDelivering = delivering === order._id;

              return (
                <div
                  key={order._id}
                  className={`relative flex flex-col bg-white rounded-3xl border shadow-md overflow-hidden transition-all duration-200 hover:shadow-xl hover:-translate-y-0.5 ${
                    order.status === "ready"
                      ? "border-emerald-200 shadow-emerald-100"
                      : isUrgent
                      ? "border-red-200 shadow-red-100"
                      : "border-slate-100"
                  }`}
                >
                  {/* Queue position badge */}
                  <div className="absolute top-4 left-4 w-7 h-7 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-black shadow-md z-10">
                    {index + 1}
                  </div>

                  {/* Urgency indicator bar */}
                  <div
                    className={`h-1.5 w-full ${
                      order.status === "ready"
                        ? "bg-emerald-500"
                        : isUrgent
                        ? "bg-red-500"
                        : isWarning
                        ? "bg-amber-400"
                        : "bg-indigo-500"
                    }`}
                  />

                  {/* Card Header */}
                  <div className="p-5 pt-4">
                    <div className="flex items-start justify-between mb-4 pl-8">
                      <span className="font-mono text-[10px] font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded tracking-widest uppercase">
                        {order.orderNumber}
                      </span>
                      <span
                        className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full ${statusStyle.bg} ${statusStyle.text} flex items-center gap-1.5`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${statusStyle.dot}`} />
                        {statusStyle.label}
                      </span>
                    </div>

                    {/* Customer name */}
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center border border-slate-100 shadow-inner flex-shrink-0">
                        <User className="h-5 w-5 text-slate-400" strokeWidth={2.5} />
                      </div>
                      <span className="text-xl font-black text-slate-900 truncate">{order.customerName}</span>
                    </div>

                    {/* Timer */}
                    <div
                      className={`flex items-center gap-2 text-xs font-black mb-4 ${
                        isUrgent ? "text-red-600" : isWarning ? "text-amber-600" : "text-slate-400"
                      }`}
                    >
                      <Clock className="h-3.5 w-3.5" strokeWidth={3} />
                      {formatDistanceToNow(new Date(order.placedAt), { addSuffix: true })}
                      {isUrgent && <span className="text-red-500 uppercase tracking-widest">• URGENT</span>}
                    </div>

                    {/* Items list */}
                    <div className="bg-slate-50 rounded-2xl border border-slate-100 p-4 space-y-2.5">
                      {order.items.map((item: any, idx: number) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between border-b border-slate-100 last:border-0 pb-2.5 last:pb-0"
                        >
                          <span className="text-slate-900 font-black text-sm flex items-center gap-2.5">
                            <span className="flex items-center justify-center w-8 h-8 font-black text-white bg-indigo-600 rounded-xl text-xs shadow-md shadow-indigo-500/20 flex-shrink-0">
                              {item.quantity}
                            </span>
                            <span>{item.name}</span>
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Footer — single Deliver action */}
                  <div className="mt-auto p-5 pt-0">
                    <div className="text-xs font-black text-slate-400 uppercase tracking-wider mb-3">
                      PKR {order.totalAmount.toLocaleString()}
                    </div>

                    <Button
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-2xl h-14 text-lg shadow-xl shadow-emerald-500/20 border-none transition-all active:scale-95"
                      onClick={() => deliverOrder(order._id)}
                      disabled={isDelivering}
                    >
                      {isDelivering ? (
                        <Loader2 className="h-6 w-6 animate-spin" />
                      ) : (
                        <>
                          <CheckCircle2 className="h-6 w-6 mr-2" strokeWidth={3} />
                          Deliver Order
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
