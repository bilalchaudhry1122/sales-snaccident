/* eslint-disable @next/next/no-img-element */
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  ToggleLeft, 
  ToggleRight,
  Loader2,
  Utensils,
  X,
  Image as ImageIcon
} from "lucide-react";

export default function MenuManagerPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form state
  const [newItemName, setNewItemName] = useState("");
  const [newItemCategory, setNewItemCategory] = useState("Snacks");
  const [newItemPrice, setNewItemPrice] = useState("");
  const [newItemImage, setNewItemImage] = useState("");

  useEffect(() => {
    fetchMenu();
  }, []);

  const fetchMenu = async () => {
    try {
      const res = await fetch("/api/menu");
      const data = await res.json();
      setItems(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const toggleStock = async (id: string) => {
    try {
      const res = await fetch(`/api/menu/${id}/stock`, { method: "PATCH" });
      if (res.ok) {
        setItems(items.map(item => item._id === id ? { ...item, inStock: !item.inStock } : item));
      }
    } catch (err) {
      console.error("Failed to toggle stock:", err);
    }
  };

  const deleteItem = async (id: string) => {
    if (!confirm("Are you sure you want to delete this item?")) return;
    try {
      const res = await fetch(`/api/menu/${id}`, { method: "DELETE" });
      if (res.ok) {
        setItems(items.filter(item => item._id !== id));
      }
    } catch (err) {
      console.error("Failed to delete item:", err);
    }
  };

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const res = await fetch("/api/menu", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newItemName,
          category: newItemCategory,
          price: Number(newItemPrice),
          imageUrl: newItemImage,
          inStock: true
        })
      });
      
      if (res.ok) {
        const addedItem = await res.json();
        setItems([...items, addedItem]);
        setIsModalOpen(false);
        // Reset form
        setNewItemName("");
        setNewItemPrice("");
        setNewItemImage("");
        setNewItemCategory("Snacks");
      }
    } catch (err) {
      console.error("Failed to add item", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredItems = items.filter(item => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8 relative">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-4xl font-black tracking-tight text-black">Menu Manager</h2>
          <p className="text-lg text-slate-600 mt-1 font-black">Add, edit, or remove items from your menu.</p>
        </div>
        <Button size="lg" className="h-12 px-6 text-base font-black shadow-lg shadow-black/5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white border-none" onClick={() => setIsModalOpen(true)}>
          <Plus className="mr-2 h-5 w-5" strokeWidth={3} /> Add New Item
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
          <Input 
            placeholder="Search for an item or category..." 
            className="pl-12 h-12 rounded-xl border-slate-200 bg-white text-black placeholder:text-slate-400 text-base font-black shadow-sm" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <Card className="border border-slate-100 shadow-xl shadow-black/5 rounded-2xl overflow-hidden bg-white">
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow className="border-slate-100 hover:bg-transparent">
              <TableHead className="w-[100px] font-black text-slate-500 tracking-widest">IMAGE</TableHead>
              <TableHead className="font-black text-slate-500 tracking-widest">ITEM NAME</TableHead>
              <TableHead className="font-black text-slate-500 tracking-widest">CATEGORY</TableHead>
              <TableHead className="font-black text-slate-500 tracking-widest">PRICE</TableHead>
              <TableHead className="font-black text-slate-500 tracking-widest">STATUS</TableHead>
              <TableHead className="text-right font-black text-slate-500 tracking-widest">ACTIONS</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto text-indigo-500" />
                </TableCell>
              </TableRow>
            ) : filteredItems.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center text-slate-500 font-medium">
                  No menu items found. Click &quot;Add New Item&quot; to create one.
                </TableCell>
              </TableRow>
            ) : (
              filteredItems.map((item) => (
                <TableRow key={item._id} className="group border-slate-100 hover:bg-slate-50/50 transition-colors">
                  <TableCell>
                    <div className="h-12 w-12 rounded-xl bg-slate-100 flex items-center justify-center overflow-hidden border border-slate-200 shadow-inner">
                      {item.imageUrl ? (
                        <img src={item.imageUrl} alt={item.name} className="h-full w-full object-cover" />
                      ) : (
                        <Utensils className="h-6 w-6 text-slate-400" />
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="font-black text-black text-base">{item.name}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="font-black bg-indigo-50 text-indigo-700 border border-indigo-100">{item.category}</Badge>
                  </TableCell>
                  <TableCell className="font-black text-black">PKR {item.price.toLocaleString()}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="p-0 hover:bg-transparent"
                        onClick={() => toggleStock(item._id)}
                      >
                        {item.inStock ? (
                          <ToggleRight className="h-8 w-8 text-emerald-600" strokeWidth={2.5} />
                        ) : (
                          <ToggleLeft className="h-8 w-8 text-slate-300" strokeWidth={2.5} />
                        )}
                      </Button>
                      <span className={`text-sm font-black ${item.inStock ? 'text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-100' : 'text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200'}`}>
                        {item.inStock ? 'In Stock' : 'Out of Stock'}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="outline" size="icon" className="h-9 w-9 rounded-lg border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:text-black">
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="icon" className="h-9 w-9 rounded-lg text-red-500 hover:text-red-700 hover:bg-red-50 border-red-100" onClick={() => deleteItem(item._id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Add Item Modal Overlay */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <Card className="w-full max-w-lg border border-slate-200 shadow-2xl rounded-3xl animate-in fade-in zoom-in-95 duration-200 bg-white">
            <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 pb-5">
              <CardTitle className="text-2xl font-black text-black">Add Menu Item</CardTitle>
              <Button variant="ghost" size="icon" onClick={() => setIsModalOpen(false)} className="rounded-full text-slate-400 hover:text-black hover:bg-slate-100">
                <X className="h-5 w-5" />
              </Button>
            </CardHeader>
            <form onSubmit={handleAddItem}>
              <CardContent className="space-y-6 pt-8 pb-2 px-8">
                <div className="space-y-2.5">
                  <label className="text-sm font-black text-slate-700 ml-1 uppercase tracking-widest">Item Name</label>
                  <Input 
                    required 
                    placeholder="e.g. Spicy Zinger Burger" 
                    className="h-14 rounded-2xl bg-slate-50 border-slate-200 text-black font-black px-5 focus-visible:ring-indigo-500"
                    value={newItemName}
                    onChange={(e) => setNewItemName(e.target.value)}
                  />
                </div>
                
                <div className="space-y-2.5">
                  <label className="text-sm font-black text-slate-700 ml-1 uppercase tracking-widest">Price (PKR)</label>
                  <div className="relative">
                    <span className="absolute left-5 top-1/2 -translate-y-1/2 font-black text-slate-400 text-base">Rs.</span>
                    <Input 
                      required 
                      type="number" 
                      min="0" 
                      placeholder="0.00" 
                      className="h-14 rounded-2xl pl-14 bg-slate-50 border-slate-200 text-black font-black px-5 focus-visible:ring-indigo-500"
                      value={newItemPrice}
                      onChange={(e) => setNewItemPrice(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2.5">
                  <label className="text-sm font-black text-slate-700 ml-1 uppercase tracking-widest">Category</label>
                  <select 
                    required
                    className="w-full h-14 px-5 py-2 rounded-2xl border border-slate-200 bg-slate-50 text-black text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-black shadow-sm"
                    value={newItemCategory}
                    onChange={(e) => setNewItemCategory(e.target.value)}
                  >
                    <option value="Snacks">Snacks</option>
                    <option value="Drinks">Drinks</option>
                    <option value="Desserts">Desserts</option>
                    <option value="Main Course">Main Course</option>
                    <option value="Deals">Deals</option>
                  </select>
                </div>

                <div className="space-y-2.5">
                  <label className="text-sm font-black text-slate-700 ml-1 uppercase tracking-widest">Image Upload</label>
                  <div className="flex flex-col gap-4">
                    <div className="relative">
                      <Input 
                        type="file" 
                        accept="image/*"
                        className="h-14 rounded-2xl bg-slate-50 border-slate-200 text-black font-black px-5 py-3 focus-visible:ring-indigo-500 file:mr-4 file:py-1 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = (event) => {
                              const img = new Image();
                              img.onload = () => {
                                const canvas = document.createElement("canvas");
                                const MAX_WIDTH = 800;
                                const MAX_HEIGHT = 800;
                                let width = img.width;
                                let height = img.height;

                                if (width > height) {
                                  if (width > MAX_WIDTH) {
                                    height *= MAX_WIDTH / width;
                                    width = MAX_WIDTH;
                                  }
                                } else {
                                  if (height > MAX_HEIGHT) {
                                    width *= MAX_HEIGHT / height;
                                    height = MAX_HEIGHT;
                                  }
                                }
                                canvas.width = width;
                                canvas.height = height;
                                const ctx = canvas.getContext("2d");
                                ctx?.drawImage(img, 0, 0, width, height);
                                setNewItemImage(canvas.toDataURL("image/jpeg", 0.7));
                              };
                              img.src = event.target?.result as string;
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                    </div>
                  </div>
                  {newItemImage && (
                    <div className="mt-4 h-40 w-full rounded-2xl overflow-hidden border border-slate-200 relative shadow-inner bg-slate-50">
                      <img src={newItemImage} alt="Preview" className="h-full w-full object-cover" onError={(e) => (e.currentTarget.style.display = 'none')} />
                    </div>
                  )}
                </div>

              </CardContent>
              <div className="border-t border-slate-100 p-8 flex justify-end gap-4 bg-slate-50/50 rounded-b-3xl">
                <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)} className="font-black rounded-2xl text-slate-500 hover:text-black px-8">Cancel</Button>
                <Button type="submit" disabled={isSubmitting} className="bg-indigo-600 hover:bg-indigo-700 font-black rounded-2xl px-10 text-white h-14 shadow-xl shadow-indigo-500/20 border-none transition-all active:scale-[0.98]">
                  {isSubmitting ? <Loader2 className="h-5 w-5 mr-3 animate-spin" /> : <Plus className="h-5 w-5 mr-3" strokeWidth={3} />}
                  Create Menu Item
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

    </div>
  );
}
