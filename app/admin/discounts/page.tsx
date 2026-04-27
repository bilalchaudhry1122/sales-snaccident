"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Plus, 
  TicketPercent, 
  Trash2, 
  ToggleLeft, 
  ToggleRight,
  Loader2,
  Tag,
  X
} from "lucide-react";

export default function DiscountManagerPage() {
  const [discounts, setDiscounts] = useState<any[]>([]);
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [newLabel, setNewLabel] = useState("");
  const [newType, setNewType] = useState("percent");
  const [newValue, setNewValue] = useState("");
  const [newScope, setNewScope] = useState("global");
  const [newMenuItemId, setNewMenuItemId] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [discountRes, menuRes] = await Promise.all([
        fetch("/api/discounts"),
        fetch("/api/menu")
      ]);
      const discountData = await discountRes.json();
      const menuData = await menuRes.json();
      
      setDiscounts(discountData);
      setMenuItems(menuData);
      if (menuData.length > 0) {
        setNewMenuItemId(menuData[0]._id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const toggleDiscount = async (id: string, current: boolean) => {
    try {
      const res = await fetch(`/api/discounts/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !current })
      });
      if (res.ok) {
        setDiscounts(discounts.map(d => d._id === id ? { ...d, isActive: !current } : d));
      }
    } catch (err) {
      console.error("Failed to toggle discount:", err);
    }
  };

  const deleteDiscount = async (id: string) => {
    if (!confirm("Are you sure you want to permanently delete this discount rule?")) return;
    try {
      const res = await fetch(`/api/discounts/${id}`, { method: "DELETE" });
      if (res.ok) {
        setDiscounts(discounts.filter(d => d._id !== id));
      }
    } catch (err) {
      console.error("Failed to delete discount:", err);
    }
  };

  const handleAddDiscount = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const payload: any = {
        label: newLabel,
        type: newType,
        value: Number(newValue),
        scope: newScope,
        isActive: true
      };

      if (newScope === "item" && newMenuItemId) {
        payload.menuItemId = newMenuItemId;
      }

      const res = await fetch("/api/discounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        // Refetch to get populated menuItemId name
        fetchData();
        setIsModalOpen(false);
        setNewLabel("");
        setNewValue("");
        setNewType("percent");
        setNewScope("global");
      } else {
        const error = await res.json();
        alert(error.error || "Failed to create discount");
      }
    } catch (err) {
      console.error("Failed to add discount", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-10 relative max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-4xl font-black tracking-tight text-black">Discounts & Promotions</h2>
          <p className="text-lg text-slate-600 mt-1 font-black">Manage global and item-specific discount rules.</p>
        </div>
        <Button size="lg" className="h-12 px-6 text-base font-black shadow-lg shadow-black/5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white border-none" onClick={() => setIsModalOpen(true)}>
          <Plus className="mr-2 h-5 w-5" strokeWidth={3} /> Create Discount
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="border border-slate-100 shadow-xl shadow-black/5 bg-white rounded-2xl overflow-hidden hover:shadow-indigo-500/10 hover:-translate-y-1 transition-all duration-300">
          <CardHeader className="pt-8 px-8 pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-black text-slate-500 uppercase tracking-widest">Active Overview</CardTitle>
              <div className="bg-indigo-50 p-2.5 rounded-xl border border-indigo-100">
                <TicketPercent className="h-5 w-5 text-indigo-600" strokeWidth={2.5} />
              </div>
            </div>
            <CardDescription className="text-slate-400 text-sm font-black mt-1 uppercase tracking-[0.1em]">Total rules running</CardDescription>
          </CardHeader>
          <CardContent className="px-8 pb-8">
            <div className="flex items-baseline gap-3">
              <span className="text-5xl font-black tracking-tight text-black">{discounts.filter(d => d.isActive).length}</span>
              <span className="text-slate-400 font-black text-lg">Active Rules</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border border-slate-100 shadow-xl shadow-black/5 rounded-2xl overflow-hidden bg-white">
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow className="border-slate-100 hover:bg-transparent">
              <TableHead className="font-black text-slate-500 px-6 tracking-widest uppercase text-xs">PROMOTION LABEL</TableHead>
              <TableHead className="font-black text-slate-500 tracking-widest uppercase text-xs">TYPE</TableHead>
              <TableHead className="font-black text-slate-500 tracking-widest uppercase text-xs">VALUE</TableHead>
              <TableHead className="font-black text-slate-500 tracking-widest uppercase text-xs">SCOPE</TableHead>
              <TableHead className="font-black text-slate-500 tracking-widest uppercase text-xs">STATUS</TableHead>
              <TableHead className="text-right font-black text-slate-500 px-6 tracking-widest uppercase text-xs">ACTIONS</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto text-indigo-500" />
                </TableCell>
              </TableRow>
            ) : discounts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-48 text-center">
                  <div className="flex flex-col items-center justify-center space-y-3">
                    <TicketPercent className="h-12 w-12 text-slate-200" strokeWidth={1.5} />
                    <p className="text-slate-400 font-black text-lg">No discount rules configured yet.</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              discounts.map((discount) => (
                <TableRow key={discount._id} className="group border-slate-100 hover:bg-slate-50/50 transition-colors">
                  <TableCell className="font-black text-black text-base px-6">
                    <div className="flex items-center gap-4">
                      <div className="bg-orange-50 p-2.5 rounded-xl border border-orange-100 shadow-sm">
                        <Tag className="h-4 w-4 text-orange-500" strokeWidth={3} />
                      </div>
                      {discount.label}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="font-black uppercase tracking-wider text-[10px] border-slate-200 bg-white text-slate-500 py-1 px-3 rounded-lg shadow-sm">{discount.type}</Badge>
                  </TableCell>
                  <TableCell className="font-black text-black text-xl tracking-tight">
                    {discount.type === 'percent' ? `${discount.value}%` : `PKR ${discount.value.toLocaleString()}`}
                  </TableCell>
                  <TableCell>
                    {discount.scope === 'global' ? (
                      <Badge className="font-black bg-indigo-50 text-indigo-700 border border-indigo-100 px-3 py-1 rounded-lg">Global</Badge>
                    ) : (
                      <Badge className="font-black bg-purple-50 text-purple-700 border border-purple-100 px-3 py-1 rounded-lg shadow-sm">
                        {discount.menuItemId?.name || 'Specific Item'}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="p-0 hover:bg-transparent"
                        onClick={() => toggleDiscount(discount._id, discount.isActive)}
                      >
                        {discount.isActive ? (
                          <ToggleRight className="h-9 w-9 text-emerald-600" strokeWidth={2.5} />
                        ) : (
                          <ToggleLeft className="h-9 w-9 text-slate-300" strokeWidth={2.5} />
                        )}
                      </Button>
                      <span className={`text-[11px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${discount.isActive ? 'text-emerald-700 bg-emerald-50 border border-emerald-100' : 'text-slate-400 bg-slate-100 border border-slate-200'}`}>
                        {discount.isActive ? 'Active' : 'Disabled'}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right px-6">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all duration-200">
                      <Button variant="outline" size="icon" className="h-10 w-10 rounded-xl text-red-500 hover:text-red-700 hover:bg-red-50 border-red-100 shadow-sm" onClick={() => deleteDiscount(discount._id)}>
                        <Trash2 className="h-4 w-4" strokeWidth={2.5} />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Add Discount Modal Overlay */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <Card className="w-full max-w-lg border border-slate-200 shadow-2xl rounded-[2rem] animate-in fade-in zoom-in-95 duration-200 bg-white overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 p-8">
              <div>
                <CardTitle className="text-2xl font-black text-black">Create Promotion</CardTitle>
                <CardDescription className="font-black text-slate-500 mt-1">Setup automated pricing rules.</CardDescription>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setIsModalOpen(false)} className="rounded-full h-10 w-10 text-slate-400 hover:text-black hover:bg-slate-100">
                <X className="h-5 w-5" />
              </Button>
            </CardHeader>
            <form onSubmit={handleAddDiscount}>
              <CardContent className="space-y-6 p-8 pb-4">
                <div className="space-y-2.5">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Promotion Label</label>
                  <Input 
                    required 
                    placeholder="e.g. Summer Mega Sale" 
                    className="h-14 rounded-2xl bg-slate-50 border-slate-200 text-black font-black px-5 focus-visible:ring-indigo-500"
                    value={newLabel}
                    onChange={(e) => setNewLabel(e.target.value)}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2.5">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Discount Type</label>
                    <select 
                      required
                      className="w-full h-14 px-5 py-2 rounded-2xl border border-slate-200 bg-slate-50 text-black text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-black shadow-sm"
                      value={newType}
                      onChange={(e) => setNewType(e.target.value)}
                    >
                      <option value="percent">Percentage (%)</option>
                      <option value="flat">Fixed Amount (PKR)</option>
                    </select>
                  </div>
                  <div className="space-y-2.5">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Value</label>
                    <div className="relative">
                      <Input 
                        required 
                        type="number" 
                        min="0" 
                        placeholder={newType === 'percent' ? "15" : "500"} 
                        className={`h-14 rounded-2xl bg-slate-50 border-slate-200 text-black font-black px-5 focus-visible:ring-indigo-500 ${newType === 'flat' ? 'pl-14' : 'pr-12'}`}
                        value={newValue}
                        onChange={(e) => setNewValue(e.target.value)}
                      />
                      {newType === 'flat' && (
                        <span className="absolute left-5 top-1/2 -translate-y-1/2 font-black text-slate-400 text-sm">Rs.</span>
                      )}
                      {newType === 'percent' && (
                        <span className="absolute right-5 top-1/2 -translate-y-1/2 font-black text-slate-400 text-sm">%</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-2.5">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Scope</label>
                  <select 
                    required
                    className="w-full h-14 px-5 py-2 rounded-2xl border border-slate-200 bg-slate-50 text-black text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-black shadow-sm"
                    value={newScope}
                    onChange={(e) => setNewScope(e.target.value)}
                  >
                    <option value="global">Global (All Menu Items)</option>
                    <option value="item">Specific Menu Item</option>
                  </select>
                </div>

                {newScope === 'item' && (
                  <div className="space-y-2.5 animate-in fade-in slide-in-from-top-2 duration-200">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Select Item</label>
                    <select 
                      required
                      className="w-full h-14 px-5 py-2 rounded-2xl border border-slate-200 bg-slate-50 text-black text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-black shadow-sm"
                      value={newMenuItemId}
                      onChange={(e) => setNewMenuItemId(e.target.value)}
                    >
                      {menuItems.map(item => (
                        <option key={item._id} value={item._id}>{item.name} - PKR {item.price}</option>
                      ))}
                    </select>
                  </div>
                )}
                <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100/50">
                  <p className="text-xs text-blue-600 font-black flex items-center gap-2">
                    <TicketPercent className="h-3 w-3" />
                    This discount will be applied automatically at checkout.
                  </p>
                </div>

              </CardContent>
              <div className="border-t border-slate-100 p-8 flex justify-end gap-4 bg-slate-50/30">
                <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)} className="font-black rounded-2xl px-8 text-slate-500 hover:text-black">Cancel</Button>
                <Button type="submit" disabled={isSubmitting} className="bg-indigo-600 hover:bg-indigo-700 font-black rounded-2xl px-10 text-white h-14 shadow-xl shadow-indigo-500/20 border-none transition-all active:scale-[0.98]">
                  {isSubmitting ? <Loader2 className="h-5 w-5 mr-3 animate-spin" /> : <Plus className="h-5 w-5 mr-3" strokeWidth={3} />}
                  Create Promotion
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
