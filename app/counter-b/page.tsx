"use client";

import { useState, useEffect, useMemo } from "react";
import { useOrderStore } from "@/store/orderStore";
import { useOrderStream } from "@/hooks/useOrderStream";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Search, 
  CheckCircle2, 
  Clock, 
  User, 
  ShoppingBag,
  Loader2,
  LogOut,
  ArrowRight,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export default function CounterBPage() {
  useOrderStream(); // Subscribe to real-time updates
  const ordersMap = useOrderStore((state) => state.orders);
  const setOrders = useOrderStore((state) => state.setOrders);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [delivering, setDelivering] = useState<string | null>(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const res = await fetch("/api/orders");
      const data = await res.json();
      setOrders(data);
    } catch (err) {
      console.error("Failed to fetch orders:", err);
    } finally {
      setLoading(false);
    }
  };

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
    } catch (err) {
      alert("Error delivering order");
    } finally {
      setDelivering(null);
    }
  };

  const updateOrderStatus = async (id: string, newStatus: string) => {
    setDelivering(id);
    try {
      const res = await fetch(`/api/orders/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus })
      });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "Failed to update order status");
      }
    } catch (err) {
      alert("Error updating order");
    } finally {
      setDelivering(null);
    }
  };

  const ordersList = useMemo(() => {
    return Array.from(ordersMap.values())
      .filter(order => 
        order.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase())
      )
      .sort((a, b) => new Date(a.placedAt).getTime() - new Date(b.placedAt).getTime());
  }, [ordersMap, searchQuery]);

  const columns = [
    { title: "Pending", status: "pending", bg: "bg-slate-50", border: "border-slate-200", dot: "bg-slate-400" },
    { title: "Preparing", status: "preparing", bg: "bg-indigo-50", border: "border-indigo-100", dot: "bg-indigo-600" },
    { title: "Ready", status: "ready", bg: "bg-emerald-50", border: "border-emerald-100", dot: "bg-emerald-600" },
  ];

  return (
    <div className="flex flex-col h-screen overflow-hidden" style={{ background: "var(--bg-base)" }}>
      <header
        className="h-16 flex items-center justify-between px-4 sm:px-8 flex-shrink-0"
        style={{
          background: "var(--bg-surface)",
          borderBottom: "1px solid var(--border)",
          boxShadow: "0 2px 16px rgba(0,0,0,0.03)",
        }}
      >
        <div className="flex items-center gap-2.5">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{
              background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
              boxShadow: "0 4px 12px rgba(99,102,241,0.2)",
            }}
          >
            <span className="text-white text-xs font-black">SN</span>
          </div>
          <div className="hidden sm:block">
            <h1 className="text-base font-black leading-none" style={{ fontFamily: "var(--font-outfit)", color: "var(--text-primary)" }}>Cooking Station</h1>
            <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>Snaccident Sales</span>
          </div>
          <h1 className="sm:hidden text-base font-black" style={{ color: "var(--text-primary)" }}>Cooking</h1>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="relative w-32 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: "var(--text-muted)" }} />
            <input
              placeholder="Search orders..."
              className="w-full pl-10 pr-4 h-9 rounded-xl text-sm font-black outline-none focus:ring-2 focus:ring-indigo-500/40 transition-all border border-slate-200"
              style={{
                background: "var(--bg-card)",
                color: "var(--text-primary)",
              }}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <a
            href="/api/auth/signout"
            className="flex items-center gap-1.5 h-9 px-3 rounded-xl text-sm font-black transition-all"
            style={{ color: "var(--text-muted)", border: "1px solid var(--border)" }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = "#dc2626"; (e.currentTarget as HTMLElement).style.background = "#fee2e2"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = "var(--text-muted)"; (e.currentTarget as HTMLElement).style.background = "transparent"; }}
          >
            <LogOut className="h-4 w-4" strokeWidth={2.5} />
            <span className="hidden sm:inline">Sign Out</span>
          </a>
        </div>
      </header>

      <main className="flex-1 overflow-x-auto p-8 flex gap-8">
        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
          </div>
        ) : (
          columns.map(col => (
            <div key={col.status} className="flex-1 min-w-[380px] flex flex-col h-full bg-slate-50 shadow-2xl shadow-black/5 rounded-3xl border border-slate-100 overflow-hidden">
              <div className={`p-7 ${col.bg} border-b ${col.border} flex items-center justify-between`}>
                <h2 className="font-black text-slate-900 uppercase tracking-[0.15em] text-sm flex items-center gap-4">
                  <span className={`w-4 h-4 rounded-full shadow-md border-2 border-white ${col.dot}`} />
                  {col.title}
                </h2>
                <Badge className="bg-white text-slate-900 font-black border border-slate-100 px-4 py-1.5 shadow-sm text-sm rounded-lg">{ordersList.filter(o => o.status === col.status).length}</Badge>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {ordersList.filter(o => o.status === col.status).map(order => {
                  const elapsedMs = new Date().getTime() - new Date(order.placedAt).getTime();
                  const urgency = elapsedMs > 600000 ? "destructive" : elapsedMs > 300000 ? "secondary" : "success";
                  
                  return (
                    <Card key={order._id} className="border border-slate-100 shadow-md bg-white hover:shadow-lg transition-all group overflow-hidden rounded-3xl">
                      <CardHeader className="p-6 pb-4 space-y-0">
                        <div className="flex items-start justify-between mb-3">
                          <span className="font-mono text-[10px] font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded tracking-widest uppercase">{order.orderNumber}</span>
                          <Badge variant={urgency === "success" ? "success" : urgency === "destructive" ? "destructive" : "secondary"} className="font-black px-3 py-1 rounded-full text-[10px] border-none shadow-sm">
                            <Clock className="h-3 w-3 mr-1.5" strokeWidth={3} />
                            {formatDistanceToNow(new Date(order.placedAt))}
                          </Badge>
                        </div>
                        <CardTitle className="text-3xl font-black text-black flex items-center gap-5">
                          <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center border border-slate-100 shadow-inner">
                            <User className="h-6 w-6 text-slate-400" strokeWidth={2.5} />
                          </div>
                          <span className="truncate">{order.customerName}</span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-6 pt-0">
                        <div className="space-y-3 bg-slate-50/80 p-5 rounded-[1.5rem] border border-slate-100 shadow-inner">
                          {order.items.map((item: any, idx: number) => (
                            <div key={idx} className="flex items-center justify-between border-b border-slate-200/50 last:border-0 pb-3.5 last:pb-0">
                              <span className="text-black font-black text-lg flex items-center gap-3">
                                <span className="flex items-center justify-center min-w-[36px] h-9 font-black text-white bg-indigo-600 rounded-xl text-sm shadow-md shadow-indigo-500/20">
                                  {item.quantity}
                                </span> 
                                <span className="tracking-tight">{item.name}</span>
                              </span>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                      <CardFooter className="p-6 pt-0 border-t border-slate-50 bg-slate-50/30">
                        <div className="flex items-center justify-between w-full pt-6">
                          <div className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">
                            PKR {order.totalAmount.toLocaleString()}
                          </div>
                          {col.status === "ready" && (
                            <Button 
                              size="lg" 
                              className="bg-emerald-600 hover:bg-emerald-700 text-white font-black px-10 rounded-[1.25rem] shadow-xl shadow-emerald-500/20 border-none h-16 text-xl transition-all active:scale-95 group"
                              onClick={() => deliverOrder(order._id)}
                              disabled={delivering === order._id}
                            >
                              {delivering === order._id ? <Loader2 className="h-8 w-8 animate-spin" /> : (
                                <>
                                  <CheckCircle2 className="h-8 w-8 mr-4 group-hover:scale-110 transition-transform" strokeWidth={3} />
                                  Deliver
                                </>
                              )}
                            </Button>
                          )}
                          {col.status !== "ready" && (
                            <Button 
                              size="lg" 
                              variant="outline" 
                              className="font-black px-10 rounded-[1.25rem] border-slate-200 bg-white text-slate-700 hover:bg-indigo-600 hover:text-white hover:border-indigo-600 h-16 text-xl transition-all active:scale-95 shadow-sm group"
                              disabled={delivering === order._id}
                              onClick={() => updateOrderStatus(order._id, col.status === 'pending' ? 'preparing' : 'ready')}
                            >
                              {delivering === order._id ? <Loader2 className="h-8 w-8 animate-spin" /> : (
                                <>
                                  Next Stage
                                  <ArrowRight className="h-8 w-8 ml-4 group-hover:translate-x-1 transition-transform" strokeWidth={3} />
                                </>
                              )}
                            </Button>
                          )}
                        </div>
                      </CardFooter>
                    </Card>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </main>
    </div>
  );
}
