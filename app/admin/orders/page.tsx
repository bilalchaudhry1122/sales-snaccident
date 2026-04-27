"use client";

import { useState, useEffect, useMemo } from "react";
import { useOrderStore } from "@/store/orderStore";
import { useOrderStream } from "@/hooks/useOrderStream";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  Eye,
  XCircle,
  AlertTriangle,
  Loader2,
  Filter,
  Calendar,
  X
} from "lucide-react";
import { format } from "date-fns";

export default function OrderManagerPage() {
  useOrderStream(); // Subscribes to real-time events
  const ordersMap = useOrderStore((state) => state.orders);
  const setOrders = useOrderStore((state) => state.setOrders);

  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [viewingOrder, setViewingOrder] = useState<any | null>(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const res = await fetch("/api/orders?status=all");
      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          alert("Session expired or unauthorized. Please refresh the page or log in again as Admin.");
        }
        return;
      }
      const data = await res.json();
      setOrders(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const cancelOrder = async (id: string) => {
    if (!confirm("Are you sure you want to cancel this order?")) return;
    setCancellingId(id);
    try {
      const res = await fetch(`/api/orders/${id}/cancel`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: "Cancelled by Admin" })
      });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "Failed to cancel order");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setCancellingId(null);
    }
  };

  const ordersList = useMemo(() => {
    return Array.from(ordersMap.values())
      .filter(order => {
        const matchesSearch = order.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = filterStatus === "all" || order.status === filterStatus;
        return matchesSearch && matchesStatus;
      })
      .sort((a, b) => new Date(b.placedAt).getTime() - new Date(a.placedAt).getTime());
  }, [ordersMap, searchQuery, filterStatus]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending": return <Badge variant="secondary">Pending</Badge>;
      case "preparing": return <Badge variant="default" className="bg-blue-500 hover:bg-blue-600">Preparing</Badge>;
      case "ready": return <Badge variant="default" className="bg-emerald-500 hover:bg-emerald-600">Ready</Badge>;
      case "delivered": return <Badge variant="success">Delivered</Badge>;
      case "cancelled": return <Badge variant="destructive">Cancelled</Badge>;
      case "failed": return <Badge variant="destructive">Failed</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-8 relative">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-4xl font-black tracking-tight text-black">Order Manager</h2>
          <p className="text-lg text-slate-600 mt-1 font-black">Track and manage all orders across the system.</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search by order # or customer..."
            className="pl-10 h-10 border-slate-200 bg-white text-black font-black shadow-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={filterStatus === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterStatus('all')}
          >
            All
          </Button>
          <Button
            variant={filterStatus === 'pending' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterStatus('pending')}
          >
            Pending
          </Button>
          <Button
            variant={filterStatus === 'preparing' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterStatus('preparing')}
          >
            Preparing
          </Button>
          <Button
            variant={filterStatus === 'ready' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterStatus('ready')}
          >
            Ready
          </Button>
          <Button
            variant={filterStatus === 'delivered' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterStatus('delivered')}
          >
            Delivered
          </Button>
          <Button
            variant={filterStatus === 'cancelled' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterStatus('cancelled')}
          >
            Cancelled
          </Button>
        </div>
      </div>

      <Card className="border border-slate-100 shadow-xl shadow-black/5 overflow-hidden bg-white rounded-2xl">
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow className="border-slate-100 hover:bg-transparent">
              <TableHead className="font-black text-slate-500 tracking-widest uppercase text-xs">Order #</TableHead>
              <TableHead className="font-black text-slate-500 tracking-widest uppercase text-xs">Date & Time</TableHead>
              <TableHead className="font-black text-slate-500 tracking-widest uppercase text-xs">Customer</TableHead>
              <TableHead className="font-black text-slate-500 tracking-widest uppercase text-xs">Items</TableHead>
              <TableHead className="font-black text-slate-500 tracking-widest uppercase text-xs">Total</TableHead>
              <TableHead className="font-black text-slate-500 tracking-widest uppercase text-xs">Status</TableHead>
              <TableHead className="text-right font-black text-slate-500 tracking-widest uppercase text-xs">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto text-slate-400" />
                </TableCell>
              </TableRow>
            ) : ordersList.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center text-slate-500">
                  No orders found matching the filter.
                </TableCell>
              </TableRow>
            ) : (
              ordersList.map((order) => (
                <TableRow key={order._id} className="group border-slate-100 hover:bg-slate-50/50 transition-colors">
                  <TableCell className="font-mono font-black text-slate-500">{order.orderNumber}</TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-sm font-black text-black">{format(new Date(order.placedAt), 'MMM dd, yyyy')}</span>
                      <span className="text-xs text-slate-500 font-black">{format(new Date(order.placedAt), 'hh:mm a')}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-black text-black">{order.customerName}</span>

                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <span className="text-sm font-black text-black">{order.items.length} items</span>
                    </div>
                  </TableCell>
                  <TableCell className="font-black text-black text-base">PKR {order.totalAmount.toLocaleString()}</TableCell>
                  <TableCell>{getStatusBadge(order.status)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="icon" className="h-8 w-8 border-slate-200 bg-white text-slate-600 hover:bg-slate-100 hover:text-black shadow-sm" onClick={() => setViewingOrder(order)}>
                        <Eye className="h-3.5 w-3.5" strokeWidth={3} />
                      </Button>
                      {['pending', 'preparing', 'ready'].includes(order.status) && (
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50 border-red-100"
                          onClick={() => cancelOrder(order._id)}
                          disabled={cancellingId === order._id}
                        >
                          {cancellingId === order._id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <XCircle className="h-3.5 w-3.5" strokeWidth={3} />}
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {/* View Order Modal */}
      {viewingOrder && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <Card className="max-w-xl w-full bg-white shadow-2xl border border-slate-200 rounded-3xl overflow-hidden">
            <CardHeader className="flex flex-row items-start justify-between border-b border-slate-100 p-8">
              <div>
                <CardTitle className="text-3xl font-black text-black">Order Details</CardTitle>
                <div className="text-sm text-slate-500 mt-1.5 flex items-center gap-2">
                  <span className="font-mono font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">{viewingOrder.orderNumber}</span>
                  <span className="text-slate-300">•</span>
                  <span className="font-black uppercase tracking-widest text-[11px]">{format(new Date(viewingOrder.placedAt), "MMM dd, hh:mm a")}</span>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setViewingOrder(null)} className="h-10 w-10 rounded-full text-slate-400 hover:text-black hover:bg-slate-100">
                <X className="h-5 w-5" strokeWidth={3} />
              </Button>
            </CardHeader>
            <div className="p-8 space-y-8 max-h-[70vh] overflow-y-auto">
              <div className="flex items-center justify-between bg-slate-50 p-6 rounded-2xl border border-slate-100">
                <div>
                  <h4 className="font-black text-black text-xl">{viewingOrder.customerName}</h4>
                </div>
                <div className="scale-125">
                  {getStatusBadge(viewingOrder.status)}
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-xs font-black uppercase tracking-widest text-slate-400">Order Items</h4>
                <div className="bg-slate-50/50 rounded-2xl border border-slate-100 p-6 space-y-4">
                  {viewingOrder.items.map((item: any, idx: number) => (
                    <div key={idx} className="flex justify-between items-center text-sm border-b border-slate-100 last:border-0 pb-4 last:pb-0">
                      <div className="flex gap-4 items-center">
                        <span className="font-black text-indigo-600 bg-indigo-50 px-3 py-1 rounded-lg text-xs">{item.quantity}x</span>
                        <span className="text-black font-black text-base">{item.name}</span>
                      </div>
                      <span className="font-black text-black text-base">PKR {item.lineTotal.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-4 border-t border-slate-100 pt-8">
                <div className="flex justify-between text-base text-slate-500 font-black">
                  <span>Subtotal</span>
                  <span>PKR {viewingOrder.subtotal.toLocaleString()}</span>
                </div>
                {viewingOrder.orderDiscount && (
                  <div className="flex justify-between text-base text-emerald-600 font-black">
                    <span>Discount applied</span>
                    <span>- PKR {(viewingOrder.subtotal - viewingOrder.totalAmount).toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between text-3xl font-black text-black pt-4 border-t border-dashed border-slate-200">
                  <span>Total Paid</span>
                  <span className="text-indigo-600">PKR {viewingOrder.totalAmount.toLocaleString()}</span>
                </div>
              </div>

              {viewingOrder.status === 'cancelled' && viewingOrder.cancellationReason && (
                <div className="bg-red-50 border border-red-100 rounded-2xl p-6 text-sm text-red-700 flex items-start gap-4">
                  <AlertTriangle className="h-6 w-6 mt-0.5 shrink-0 text-red-500" strokeWidth={3} />
                  <div>
                    <span className="font-black block mb-1 uppercase tracking-widest text-[10px] text-red-500">Cancellation Reason</span>
                    <p className="font-black text-base">{viewingOrder.cancellationReason}</p>
                  </div>
                </div>
              )}
            </div>
            <div className="border-t border-slate-100 p-8 flex justify-end bg-slate-50/50">
              <Button onClick={() => setViewingOrder(null)} variant="outline" className="font-black h-12 px-10 rounded-2xl border-slate-200 text-slate-700 hover:bg-white hover:text-black shadow-sm">Close Details</Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
