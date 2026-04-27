"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  BarChart3, 
  TrendingUp, 
  Activity,
  DollarSign,
  ShoppingCart
} from "lucide-react";

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const res = await fetch("/api/analytics/summary");
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error("Error fetching analytics", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-10 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-4xl font-black tracking-tight text-slate-900">Analytics & Insights</h2>
          <p className="text-lg text-slate-500 mt-1 font-medium">Deep dive into your business performance.</p>
        </div>

      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="border-none shadow-xl shadow-indigo-500/10 rounded-2xl overflow-hidden bg-gradient-to-br from-indigo-500 to-indigo-600 text-white hover:-translate-y-1 transition-transform">
          <CardHeader className="pb-2 pt-8 px-8">
            <div className="flex justify-between items-center">
              <CardTitle className="text-sm font-bold text-indigo-100 uppercase tracking-widest">Gross Revenue</CardTitle>
              <div className="bg-white/20 p-2.5 rounded-xl">
                <DollarSign className="h-5 w-5 text-white" strokeWidth={2.5} />
              </div>
            </div>
          </CardHeader>
          <CardContent className="px-8 pb-8">
            <div className="text-5xl font-black tracking-tight mt-2">
              <span className="text-2xl text-indigo-200 mr-1">PKR</span>
              {data?.summary?.totalRevenue?.toLocaleString() || "0"}
            </div>
            <p className="text-sm text-indigo-100 mt-4 flex items-center font-medium bg-white/10 w-fit px-3 py-1.5 rounded-lg">
              <TrendingUp className="h-4 w-4 mr-2" /> +14.2% from last month
            </p>
          </CardContent>
        </Card>

        <Card className="border border-slate-100 shadow-xl shadow-slate-200/40 rounded-2xl overflow-hidden bg-white hover:-translate-y-1 transition-transform">
          <CardHeader className="pb-2 pt-8 px-8">
            <div className="flex justify-between items-center">
              <CardTitle className="text-sm font-bold text-slate-500 uppercase tracking-widest">Total Orders</CardTitle>
              <div className="bg-blue-50 p-2.5 rounded-xl border border-blue-100">
                <ShoppingCart className="h-5 w-5 text-blue-500" strokeWidth={2.5} />
              </div>
            </div>
          </CardHeader>
          <CardContent className="px-8 pb-8">
            <div className="text-5xl font-black tracking-tight mt-2 text-slate-900">
              {data?.summary?.totalOrders?.toLocaleString() || "0"}
            </div>
            <p className="text-sm text-emerald-600 mt-4 flex items-center font-bold bg-emerald-50 w-fit px-3 py-1.5 rounded-lg border border-emerald-100">
              <TrendingUp className="h-4 w-4 mr-2" /> +5.4% from last month
            </p>
          </CardContent>
        </Card>

        <Card className="border border-slate-100 shadow-xl shadow-slate-200/40 rounded-2xl overflow-hidden bg-white hover:-translate-y-1 transition-transform">
          <CardHeader className="pb-2 pt-8 px-8">
            <div className="flex justify-between items-center">
              <CardTitle className="text-sm font-bold text-slate-500 uppercase tracking-widest">Discounts Given</CardTitle>
              <div className="bg-orange-50 p-2.5 rounded-xl border border-orange-100">
                <Activity className="h-5 w-5 text-orange-500" strokeWidth={2.5} />
              </div>
            </div>
          </CardHeader>
          <CardContent className="px-8 pb-8">
            <div className="text-5xl font-black tracking-tight mt-2 text-slate-900">
              <span className="text-2xl text-slate-400 mr-1">PKR</span>
              {data?.summary?.totalDiscount?.toLocaleString() || "0"}
            </div>
            <p className="text-sm text-slate-500 mt-4 flex items-center font-medium bg-slate-50 w-fit px-3 py-1.5 rounded-lg border border-slate-200">
              Impacts margins by ~2.1%
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-none shadow-xl shadow-slate-200/40 rounded-2xl bg-white">
          <CardHeader className="px-8 pt-8">
            <CardTitle className="text-2xl font-black text-slate-900">Revenue Over Time</CardTitle>
            <CardDescription className="text-base font-medium">Daily revenue breakdown for the selected period.</CardDescription>
          </CardHeader>
          <CardContent className="px-8 pb-8">
            <div className="h-[400px] w-full rounded-xl bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-100 flex items-center justify-center">
              <div className="text-center space-y-3">
                <BarChart3 className="h-12 w-12 text-indigo-300 mx-auto" />
                <p className="text-slate-500 font-bold text-lg">Interactive Chart Area</p>
                <p className="text-slate-400 text-sm">Waiting for real data stream...</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-xl shadow-slate-200/40 rounded-2xl bg-white">
          <CardHeader className="px-8 pt-8">
            <CardTitle className="text-2xl font-black text-slate-900">Order Status Breakdown</CardTitle>
            <CardDescription className="text-base font-medium">Distribution of order states.</CardDescription>
          </CardHeader>
          <CardContent className="px-8 pb-8">
            <div className="space-y-6 mt-4">
              {['delivered', 'cancelled', 'failed'].map((status) => {
                const count = data?.statusBreakdown?.[status] || 0;
                const total = data?.summary?.totalOrders || 1; // Prevent div by 0
                const percent = Math.round((count / total) * 100);
                
                return (
                  <div key={status} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-slate-700 capitalize">{status}</span>
                      <span className="font-bold text-slate-900">{count} <span className="text-slate-400 font-medium text-sm ml-1">({percent}%)</span></span>
                    </div>
                    <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${
                          status === 'delivered' ? 'bg-emerald-500' : 
                          status === 'cancelled' ? 'bg-orange-500' : 'bg-red-500'
                        }`} 
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
