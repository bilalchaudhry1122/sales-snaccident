/* eslint-disable @next/next/no-img-element */
"use client";

import { useState, useEffect, useMemo } from "react";
import { useOrderStore } from "@/store/orderStore";
import { useOrderStream } from "@/hooks/useOrderStream";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Plus, 
  Minus, 
  Trash2, 
  Search, 
  ShoppingBag, 
  User, 
  ArrowRight,
  CheckCircle2,
  Loader2,
  XCircle,
  Edit,
  History,
  Store,
  LogOut
} from "lucide-react";
import { format } from "date-fns";

export default function CounterAPage() {
  useOrderStream();
  const ordersMap = useOrderStore((state) => state.orders);
  const fetchAndSetOrders = useOrderStore((state) => state.fetchAndSetOrders);

  const [viewMode, setViewMode] = useState<'menu' | 'orders'>('menu');
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [cart, setCart] = useState<any[]>([]);
  const [customerName, setCustomerName] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeDiscounts, setActiveDiscounts] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [successOrder, setSuccessOrder] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  useEffect(() => {
    const fetchMenu = async () => {
      setLoading(true);
      try {
        const [menuRes, discountsRes] = await Promise.all([
          fetch("/api/menu"),
          fetch("/api/discounts")
        ]);

        if (menuRes.ok) {
          const menuData = await menuRes.json();
          setMenuItems(menuData);
        }

        if (discountsRes.ok) {
          const discountsData = await discountsRes.json();
          // Only use array result (guard against error objects)
          if (Array.isArray(discountsData)) {
            setActiveDiscounts(discountsData.filter((d: any) => d.isActive));
          }
        } else {
          console.error("Failed to load discounts, status:", discountsRes.status);
        }
      } catch (err) {
        console.error("fetchMenu error:", err);
      } finally {
        setLoading(false);
      }
    };

    const fetchInitialOrders = async () => {
      try {
        // Fetch active orders only for counter screen (keeps payload tiny)
        await fetchAndSetOrders({ limit: 100 });
      } catch (err) {
        console.error("Failed to fetch initial orders", err);
      }
    };

    fetchMenu();
    fetchInitialOrders();
  }, [fetchAndSetOrders]);

  const addToCart = (item: any) => {
    setCart(prev => {
      const existing = prev.find(i => i._id === item._id || i.menuItemId === item._id);
      if (existing) {
        return prev.map(i => (i._id === item._id || i.menuItemId === item._id) ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { ...item, menuItemId: item._id, quantity: 1 }];
    });
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(prev => prev.map(i => {
      if (i._id === id || i.menuItemId === id) {
        const newQty = Math.max(0, i.quantity + delta);
        return { ...i, quantity: newQty };
      }
      return i;
    }).filter(i => i.quantity > 0));
  };

  const globalDiscount = activeDiscounts.find(d => d.scope === 'global');
  const itemDiscounts = activeDiscounts.filter(d => d.scope === 'item');

  // Calculate Subtotal (Before Global Discount, but WITH Item Discounts applied)
  let subtotal = 0;
  
  const cartWithDiscounts = cart.map(item => {
    const basePrice = item.price || item.priceAtOrder;
    const itemId = item.menuItemId || item._id;
    let lineTotal = basePrice * item.quantity;
    
    // Check for item specific discount
    const itemDiscountDef = itemDiscounts.find(d => {
      const discountItemId = d.menuItemId?._id?.toString() || d.menuItemId?.toString() || d.menuItemId;
      return discountItemId === itemId?.toString();
    });
    let itemDiscountVal = 0;
    
    if (itemDiscountDef) {
      if (itemDiscountDef.type === 'percent') {
        itemDiscountVal = Math.round(lineTotal * (itemDiscountDef.value / 100));
      } else if (itemDiscountDef.type === 'flat') {
        itemDiscountVal = itemDiscountDef.value * item.quantity; // Apply flat per unit
      }
      itemDiscountVal = Math.min(itemDiscountVal, lineTotal);
      lineTotal -= itemDiscountVal;
    }
    
    subtotal += lineTotal;
    
    return {
      ...item,
      basePrice,
      lineTotal,
      itemDiscountApplied: itemDiscountDef,
      itemDiscountVal
    };
  });

  // Calculate Global Discount Amount on the Subtotal
  let globalDiscountAmount = 0;
  if (globalDiscount && subtotal > 0) {
    if (globalDiscount.type === 'percent') {
      globalDiscountAmount = Math.round(subtotal * (globalDiscount.value / 100));
    } else if (globalDiscount.type === 'flat') {
      globalDiscountAmount = globalDiscount.value;
    }
    globalDiscountAmount = Math.min(globalDiscountAmount, subtotal);
  }
  
  const total = subtotal - globalDiscountAmount;

  const placeOrder = async () => {
    if (!customerName) return alert("Customer name is required");
    if (cart.length === 0) return alert("Cart is empty");

    setSubmitting(true);
    try {
      const payload: any = {
        customerName,
        items: cartWithDiscounts.map(item => {
          const orderItem: any = {
            menuItemId: item.menuItemId || item._id,
            name: item.name,
            priceAtOrder: item.basePrice,
            quantity: item.quantity,
            lineTotal: item.lineTotal
          };
          if (item.itemDiscountApplied) {
            orderItem.itemDiscount = {
              discountType: item.itemDiscountApplied.type,
              value: item.itemDiscountApplied.value
            };
          }
          return orderItem;
        }),
        subtotal,
        totalAmount: total
      };

      if (globalDiscountAmount > 0 && globalDiscount) {
        payload.orderDiscount = {
          discountType: globalDiscount.type,
          value: globalDiscount.value,
          label: globalDiscount.label
        };
      }

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (res.ok) {
        setSuccessOrder(data.orderNumber);
        setCart([]);
        setCustomerName("");
      } else {
        alert(data.error || "Failed to place order");
      }
    } catch (err) {
      alert("Error placing order");
    } finally {
      setSubmitting(false);
    }
  };

  const cancelOrder = async (id: string) => {
    if (!confirm("Are you sure you want to cancel this order?")) return;
    setCancellingId(id);
    try {
      const res = await fetch(`/api/orders/${id}/cancel`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: "Cancelled by counter A" })
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

  const editOrder = (order: any) => {
    if (!confirm("This will load the order into your cart and cancel the original order. Proceed?")) return;
    
    // Put items in cart
    setCart(order.items.map((i: any) => ({
      _id: i.menuItemId,
      menuItemId: i.menuItemId,
      name: i.name,
      price: i.priceAtOrder,
      quantity: i.quantity
    })));
    setCustomerName(order.customerName);
    
    // Switch to menu view
    setViewMode('menu');
    
    // Cancel the old order
    cancelOrder(order._id);
  };

  const filteredMenu = menuItems.filter(item => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const ordersList = useMemo(() => {
    return Array.from(ordersMap.values())
      .sort((a, b) => new Date(b.placedAt).getTime() - new Date(a.placedAt).getTime());
  }, [ordersMap]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending": return <Badge variant="secondary" className="bg-slate-100 text-slate-600 font-black border-none px-3 py-1">Pending</Badge>;
      case "preparing": return <Badge variant="default" className="bg-indigo-600 hover:bg-indigo-700 text-white font-black border-none px-3 py-1">Preparing</Badge>;
      case "ready": return <Badge variant="default" className="bg-emerald-600 hover:bg-emerald-700 text-white font-black border-none px-3 py-1">Ready</Badge>;
      case "delivered": return <Badge variant="success" className="bg-emerald-50 text-emerald-700 font-black border border-emerald-100 px-3 py-1">Delivered</Badge>;
      case "cancelled": return <Badge variant="destructive" className="font-black px-3 py-1">Cancelled</Badge>;
      case "failed": return <Badge variant="destructive" className="font-black px-3 py-1">Failed</Badge>;
      default: return <Badge variant="outline" className="font-black px-3 py-1">{status}</Badge>;
    }
  };

  if (successOrder) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
        <Card className="max-w-md w-full text-center p-8 space-y-6 bg-white border-slate-200 shadow-2xl rounded-3xl">
          <div className="flex justify-center">
            <div className="rounded-3xl bg-emerald-50 p-5 text-emerald-600 border border-emerald-100 shadow-sm">
              <CheckCircle2 className="h-14 w-14" strokeWidth={3} />
            </div>
          </div>
          <div className="space-y-3">
            <h2 className="text-3xl font-black text-black">Order Placed!</h2>
            <p className="text-slate-500 text-lg font-black">Order Number: <span className="font-mono font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">{successOrder}</span></p>
          </div>
          <div className="flex gap-4 pt-4">
            <Button className="flex-1 h-14 text-lg font-black bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl shadow-xl shadow-indigo-500/20 border-none" onClick={() => setSuccessOrder(null)}>
              New Order
            </Button>
            <Button variant="outline" className="flex-1 h-14 text-lg font-black border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-black rounded-2xl shadow-sm" onClick={() => { setSuccessOrder(null); setViewMode('orders'); }}>
              View Queue
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "var(--bg-base)" }}>
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Dark DashPro-style Header */}
        <header
          className="h-16 flex items-center justify-between px-4 sm:px-8 flex-shrink-0"
          style={{
            background: "var(--bg-surface)",
            borderBottom: "1px solid var(--border)",
            boxShadow: "0 2px 16px rgba(0,0,0,0.03)",
          }}
        >
          <div className="flex items-center gap-3 sm:gap-5">
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
                <h1 className="text-base font-black leading-none" style={{ fontFamily: "var(--font-outfit)", color: "var(--text-primary)" }}>Order Counter</h1>
                <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>Snaccident Sales</span>
              </div>
              <h1 className="sm:hidden text-base font-black" style={{ color: "var(--text-primary)" }}>Order</h1>
            </div>
            {/* View Toggle */}
            <div className="flex items-center p-1 rounded-xl gap-0.5 bg-slate-100 border border-slate-200">
              <button
                onClick={() => setViewMode('menu')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-black transition-all"
                style={{
                  background: viewMode === 'menu' ? "var(--accent)" : "transparent",
                  color: viewMode === 'menu' ? "#fff" : "#64748b",
                  boxShadow: viewMode === 'menu' ? "0 2px 8px rgba(99,102,241,0.3)" : "none",
                }}
              >
                <Store className="h-3.5 w-3.5" strokeWidth={3} /><span className="hidden sm:inline"> Menu</span>
              </button>
              <button
                onClick={() => setViewMode('orders')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-black transition-all"
                style={{
                  background: viewMode === 'orders' ? "var(--accent)" : "transparent",
                  color: viewMode === 'orders' ? "#fff" : "#64748b",
                  boxShadow: viewMode === 'orders' ? "0 2px 8px rgba(99,102,241,0.3)" : "none",
                }}
              >
                <History className="h-3.5 w-3.5" strokeWidth={3} /><span className="hidden sm:inline"> Live Orders</span>
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {viewMode === 'menu' && (
              <div className="relative w-32 sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: "var(--text-muted)" }} />
                <input
                  placeholder="Search menu..."
                  className="w-full pl-10 pr-4 h-9 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500/40 transition-all"
                  style={{
                    background: "var(--bg-card)",
                    border: "1px solid var(--border)",
                    color: "var(--text-primary)",
                  }}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            )}
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

        <div className="flex-1 overflow-y-auto p-8">
          {viewMode === 'menu' ? (
            loading ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="h-12 w-12 animate-spin text-slate-700" />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredMenu.map(item => (
                  <Card 
                    key={item._id} 
                    className={`border border-slate-100 shadow-xl shadow-black/5 hover:shadow-indigo-500/10 transition-all cursor-pointer overflow-hidden group bg-white rounded-3xl ${!item.inStock ? 'opacity-40 grayscale pointer-events-none' : 'hover:-translate-y-1'}`}
                    onClick={() => item.inStock && addToCart(item)}
                  >
                    <div className="aspect-video bg-slate-100 relative overflow-hidden">
                      {item.imageUrl ? (
                        <img src={item.imageUrl} alt={item.name} className="object-cover w-full h-full transition-transform group-hover:scale-110 duration-500" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-300">
                          <ShoppingBag className="h-12 w-12" />
                        </div>
                      )}
                      {!item.inStock && (
                        <div className="absolute inset-0 bg-white/60 flex items-center justify-center backdrop-blur-[1px]">
                          <Badge variant="destructive" className="text-sm font-black px-4 py-1.5 rounded-full shadow-lg border-none">OUT OF STOCK</Badge>
                        </div>
                      )}
                    </div>
                    <CardContent className="p-6 space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-black text-xl text-black line-clamp-1 leading-none">{item.name}</h3>
                        <Badge variant="secondary" className="text-[10px] font-black uppercase tracking-widest bg-slate-100 text-slate-600 border-none shrink-0 px-2 py-0.5">{item.category}</Badge>
                      </div>
                      <p className="text-slate-500 text-sm line-clamp-2 font-black leading-relaxed">{item.description}</p>
                      <div className="pt-4 flex items-center justify-between border-t border-slate-50">
                        <div className="flex flex-col">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Price</span>
                          <span className="text-2xl font-black text-indigo-600">PKR {item.price.toLocaleString()}</span>
                        </div>
                        <Button size="icon" className="rounded-2xl h-12 w-12 bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-500/20 border-none transition-all group-active:scale-90" disabled={!item.inStock}>
                          <Plus className="h-6 w-6 text-white" strokeWidth={3} />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )
          ) : (
            <Card className="border border-slate-100 shadow-xl shadow-black/5 overflow-hidden bg-white rounded-3xl">
              <Table>
                <TableHeader className="bg-slate-50">
                  <TableRow className="border-slate-100 hover:bg-transparent">
                    <TableHead className="font-black text-slate-500 tracking-widest uppercase text-xs">Order #</TableHead>
                    <TableHead className="font-black text-slate-500 tracking-widest uppercase text-xs">Time</TableHead>
                    <TableHead className="font-black text-slate-500 tracking-widest uppercase text-xs">Customer</TableHead>
                    <TableHead className="font-black text-slate-500 tracking-widest uppercase text-xs">Status</TableHead>
                    <TableHead className="font-black text-slate-500 tracking-widest uppercase text-xs">Total</TableHead>
                    <TableHead className="text-right font-black text-slate-500 tracking-widest uppercase text-xs">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ordersList.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-32 text-center text-slate-500 font-bold italic">
                        No orders found in the queue.
                      </TableCell>
                    </TableRow>
                  ) : (
                    ordersList.map(order => (
                      <TableRow key={order._id} className="border-slate-100 hover:bg-slate-50/50 transition-colors group">
                        <TableCell className="font-mono font-black text-indigo-600 bg-indigo-50/30 text-center rounded-lg">{order.orderNumber}</TableCell>
                        <TableCell className="font-black text-black">{format(new Date(order.placedAt), 'hh:mm a')}</TableCell>
                        <TableCell>
                          <div className="font-black text-black text-base">{order.customerName}</div>
                          <div className="text-xs text-slate-400 font-black">{order.items.length} items</div>
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(order.status)}
                        </TableCell>
                        <TableCell className="font-black text-indigo-600 text-xl">PKR {order.totalAmount.toLocaleString()}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-3">
                            {['pending', 'preparing'].includes(order.status) && (
                              <>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  className="font-black rounded-xl border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:text-black shadow-sm"
                                  onClick={() => editOrder(order)}
                                >
                                  <Edit className="h-4 w-4 mr-2" strokeWidth={3} /> Edit
                                </Button>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  className="font-black rounded-xl text-red-500 hover:text-red-700 hover:bg-red-50 border-red-100"
                                  onClick={() => cancelOrder(order._id)}
                                  disabled={cancellingId === order._id}
                                >
                                  {cancellingId === order._id ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4 mr-2" strokeWidth={3} />} 
                                  Cancel
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </Card>
          )}
        </div>
      </div>

      {/* Cart Side */}
      {viewMode === 'menu' && (
        <aside className="w-[480px] bg-white border-l border-slate-200 shadow-2xl flex flex-col h-full flex-shrink-0">
          <div className="p-8 border-b border-slate-100 flex-shrink-0 bg-slate-50/50">
            <h2 className="text-3xl font-black text-black flex items-center gap-4">
              <ShoppingBag className="h-8 w-8 text-indigo-600" strokeWidth={3} />
              Current Order
            </h2>
          </div>

          <div className="p-8 border-b border-slate-100 space-y-5 flex-shrink-0">
            <div className="space-y-3.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Customer Identification</label>
              <div className="relative">
                <User className="absolute left-5 top-1/2 -translate-y-1/2 h-6 w-6 text-slate-400" />
                <Input 
                  placeholder="Customer Name *" 
                  className="pl-14 h-16 rounded-2xl bg-slate-50 border-slate-200 text-black font-black text-xl placeholder:text-slate-300 focus-visible:ring-indigo-500" 
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-8 space-y-5">
            {cartWithDiscounts.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-200 space-y-8">
                <div className="h-28 w-28 rounded-[2.5rem] bg-slate-50 flex items-center justify-center border border-slate-100 shadow-inner">
                  <ShoppingBag className="h-14 w-14 opacity-20 text-slate-400" />
                </div>
                <p className="text-center font-black text-xl text-slate-300 uppercase tracking-widest leading-loose">Cart is currently empty.<br/>Select menu items above.</p>
              </div>
            ) : (
              cartWithDiscounts.map(item => (
                <div key={item._id || item.menuItemId} className="flex items-center gap-5 bg-slate-50 p-5 rounded-3xl border border-slate-100 hover:border-indigo-100 hover:bg-white transition-all shadow-sm hover:shadow-md">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <p className="font-black text-black text-lg truncate leading-tight">{item.name}</p>
                      {item.itemDiscountApplied && (
                        <Badge variant="secondary" className="bg-orange-500 text-white text-[9px] font-black uppercase border-none px-2">
                          OFFER
                        </Badge>
                      )}
                    </div>
                    <div className="text-sm">
                      {item.itemDiscountApplied ? (
                        <div className="flex items-center gap-2">
                          <span className="line-through text-slate-300 font-black">PKR {item.basePrice.toLocaleString()}</span>
                          <span className="text-orange-600 font-black text-base">PKR {(item.basePrice - (item.itemDiscountVal / item.quantity)).toLocaleString()}</span>
                        </div>
                      ) : (
                        <span className="text-slate-500 font-black text-base">PKR {item.basePrice.toLocaleString()}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 bg-white rounded-2xl border border-slate-200 p-1 shadow-sm">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-9 w-9 text-slate-600 hover:bg-slate-100 rounded-xl"
                      onClick={() => updateQuantity(item._id || item.menuItemId, -1)}
                    >
                      <Minus className="h-4 w-4" strokeWidth={3} />
                    </Button>
                    <span className="w-8 text-center font-black text-black text-lg">{item.quantity}</span>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-9 w-9 text-slate-600 hover:bg-slate-100 rounded-xl"
                      onClick={() => updateQuantity(item._id || item.menuItemId, 1)}
                    >
                      <Plus className="h-4 w-4" strokeWidth={3} />
                    </Button>
                  </div>
                  <div className="text-right font-black text-indigo-600 min-w-[100px] text-lg">
                    PKR {item.lineTotal.toLocaleString()}
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="p-8 bg-slate-50 border-t border-slate-200 space-y-8 flex-shrink-0">
            <div className="space-y-4">
              <div className="flex justify-between text-slate-400 font-black text-lg">
                <span>Subtotal</span>
                <span>PKR {subtotal.toLocaleString()}</span>
              </div>
              {globalDiscountAmount > 0 && (
                <div className="flex justify-between text-emerald-700 font-black bg-emerald-50 p-5 rounded-2xl border border-emerald-100 shadow-sm">
                  <span className="flex items-center gap-3">
                    Discount <Badge variant="outline" className="bg-emerald-600 text-white border-none text-[10px] font-black px-3">{globalDiscount?.label}</Badge>
                  </span>
                  <span>- PKR {globalDiscountAmount.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between items-end pt-4 border-t border-dashed border-slate-200">
                <span className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] pb-1">Grand Total</span>
                <span className="text-5xl font-black text-black tracking-tighter">PKR {total.toLocaleString()}</span>
              </div>
            </div>
            <Button 
              className="w-full h-20 text-2xl font-black bg-indigo-600 hover:bg-indigo-700 text-white rounded-[2rem] shadow-2xl shadow-indigo-500/20 border-none transition-all active:scale-[0.98] group" 
              size="lg" 
              disabled={submitting || cart.length === 0}
              onClick={placeOrder}
            >
              {submitting ? <Loader2 className="h-10 w-10 animate-spin" /> : (
                <>
                  Process Order
                  <ArrowRight className="ml-4 h-8 w-8 group-hover:translate-x-2 transition-transform" strokeWidth={4} />
                </>
              )}
            </Button>
          </div>
        </aside>
      )}
    </div>
  );
}
