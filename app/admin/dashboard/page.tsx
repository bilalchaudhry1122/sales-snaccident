"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  DollarSign, 
  ShoppingBag, 
  TicketPercent, 
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Clock,
  ArrowRight,
  ShieldAlert,
  Loader2,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";

export default function AdminDashboard() {
  const [summary, setSummary] = useState({ totalRevenue: 0, totalDiscount: 0, totalOrders: 0, avgOrderValue: 0 });
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  // Reset Modal States
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [resetStep, setResetStep] = useState(1);
  const [adminPassword, setAdminPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const res = await fetch("/api/audit/report");
      const data = await res.json();
      
      setSummary(data.summary || { totalRevenue: 0, totalDiscounts: 0, totalOrders: 0, averageOrderValue: 0 });
      
      const recent = data.allOrders.slice(-10).reverse().map((order: any) => ({
        type: order.status,
        order: `ORD-${order.orderNumber}`,
        time: new Date(order.placedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
        user: order.placedBy?.name || 'System'
      }));
      setRecentActivity(recent);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/system/reset/request-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: adminPassword })
      });
      const data = await res.json();
      if (res.ok) {
        setResetStep(2);
        if (!data.emailSent) {
          alert("Development Mode: Email not sent. Please check the terminal/console for your OTP.");
        }
      } else {
        alert(data.error + (data.details ? `\nDetails: ${data.details}` : ""));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/system/reset/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ otp })
      });
      const data = await res.json();
      if (res.ok) {
        alert("System successfully wiped.");
        setIsResetModalOpen(false);
        setResetStep(1);
        setAdminPassword("");
        setOtp("");
        fetchDashboardData(); // Refresh data
      } else {
        alert(data.error || "Invalid OTP");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const stats = [
    { title: "Total Revenue", value: `PKR ${summary.totalRevenue?.toLocaleString() || 0}`, icon: DollarSign, trend: "Overall", color: "text-emerald-500", bg: "bg-emerald-500/10", border: "border-emerald-100" },
    { title: "Delivered Orders", value: (summary.totalOrders || 0).toString(), icon: ShoppingBag, trend: "Overall", color: "text-blue-500", bg: "bg-blue-500/10", border: "border-blue-100" },
    { title: "Total Discounts", value: `PKR ${(summary as any).totalDiscounts?.toLocaleString() || 0}`, icon: TicketPercent, trend: "Overall", color: "text-orange-500", bg: "bg-orange-500/10", border: "border-orange-100" },
    { title: "Avg. Order Value", value: `PKR ${(summary as any).averageOrderValue?.toLocaleString() || 0}`, icon: TrendingUp, trend: "Overall", color: "text-purple-500", bg: "bg-purple-500/10", border: "border-purple-100" },
  ];

  return (
    <div className="space-y-10 max-w-7xl mx-auto relative">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-4xl font-black tracking-tight text-black">Dashboard Overview</h2>
          <p className="text-lg text-slate-600 mt-1 font-black">Welcome back! Here is what's happening right now.</p>
        </div>
        <Link href="/admin/audit">
          <Button size="lg" className="h-12 px-6 text-base font-black shadow-lg shadow-black/5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white border-none">
            Generate Report <ArrowRight className="ml-2 h-5 w-5" strokeWidth={3} />
          </Button>
        </Link>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title} className={`border border-slate-100 shadow-xl shadow-black/5 rounded-2xl overflow-hidden hover:shadow-indigo-500/10 hover:-translate-y-1 transition-all duration-300 bg-white`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 pt-6 px-6">
              <CardTitle className="text-sm font-black text-slate-500 uppercase tracking-widest">{stat.title}</CardTitle>
              <div className={`${stat.bg} p-2.5 rounded-xl`}>
                <stat.icon className={`h-5 w-5 ${stat.color}`} strokeWidth={2.5} />
              </div>
            </CardHeader>
            <CardContent className="px-6 pb-6">
              <div className="text-4xl font-black text-black mt-2 tracking-tight">{stat.value}</div>
              <p className="text-sm text-emerald-600 mt-3 flex items-center gap-1.5 font-black bg-emerald-50 w-fit px-2 py-1 rounded-md">
                <TrendingUp className="h-4 w-4" />
                {stat.trend} metrics
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 grid-cols-1">
        <Card className="border border-slate-100 shadow-xl shadow-black/5 rounded-2xl bg-white">
          <CardHeader className="px-8 pt-8">
            <CardTitle className="text-2xl font-black text-black">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent className="px-8 pb-8">
            <div className="space-y-6">
              {recentActivity.length === 0 ? (
                <p className="text-slate-500 italic font-black">No activity yet. Go place some orders!</p>
              ) : (
                recentActivity.map((activity: any, i: number) => (
                  <div key={i} className="flex items-start gap-5 p-4 -mx-4 rounded-xl hover:bg-slate-50 transition-colors cursor-default border border-transparent hover:border-slate-100">
                    <div className={`mt-0.5 rounded-2xl p-2.5 shadow-sm ${
                      activity.type === 'delivered' ? 'bg-emerald-100 text-emerald-600' :
                      activity.type === 'pending' || activity.type === 'placed' ? 'bg-blue-100 text-blue-600' :
                      activity.type === 'cancelled' ? 'bg-red-100 text-red-600' : 'bg-orange-100 text-orange-600'
                    }`}>
                      {activity.type === 'delivered' ? <CheckCircle2 className="h-5 w-5" strokeWidth={2.5} /> :
                       activity.type === 'pending' || activity.type === 'placed' ? <ShoppingBag className="h-5 w-5" strokeWidth={2.5} /> :
                       activity.type === 'cancelled' ? <AlertCircle className="h-5 w-5" strokeWidth={2.5} /> : <Clock className="h-5 w-5" strokeWidth={2.5} />}
                    </div>
                    <div className="flex-1 space-y-1">
                      <p className="text-lg font-black text-black">
                        Order {activity.order} was {activity.type}
                      </p>
                      <p className="text-sm font-black text-slate-500">
                        Processed by <span className="text-indigo-600">{activity.user}</span> • {activity.time}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
