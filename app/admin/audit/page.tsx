"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { 
  FileDown, 
  History, 
  Calendar, 
  Filter, 
  ArrowRight,
  FileSpreadsheet,
  FileJson,
  Loader2
} from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import Papa from "papaparse";
import { format } from "date-fns";

export default function AuditReportPage() {
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [generating, setGenerating] = useState<string | null>(null);

  const fetchReportData = async () => {
    const res = await fetch(`/api/audit/report?from=${fromDate}&to=${toDate}`);
    if (!res.ok) throw new Error("Failed to fetch report data");
    return await res.json();
  };

  const generateReport = async (formatType: string) => {
    if (!fromDate || !toDate) return alert("Please select a date range");
    
    setGenerating(formatType);
    
    try {
      const data = await fetchReportData();
      const timestamp = format(new Date(), "yyyyMMdd_HHmmss");
      const filename = `Snaccident_AuditReport_${fromDate}_to_${toDate}_${timestamp}`;

      if (formatType === 'pdf') {
        const doc = new jsPDF();
        
        // Header
        doc.setFontSize(20);
        doc.text("Snaccident - Audit Report", 14, 22);
        doc.setFontSize(11);
        doc.setTextColor(100);
        doc.text(`Period: ${fromDate} to ${toDate}`, 14, 30);
        doc.text(`Generated: ${format(new Date(), "PPP pp")}`, 14, 36);

        // Summary
        doc.setFontSize(14);
        doc.setTextColor(0);
        doc.text("Financial Summary", 14, 50);
        autoTable(doc, {
          startY: 55,
          head: [['Metric', 'Value']],
          body: [
            ['Total Revenue', `PKR ${data.summary.totalRevenue.toLocaleString()}`],
            ['Total Discounts Applied', `PKR ${data.summary.totalDiscounts.toLocaleString()}`],
            ['Delivered Orders', data.summary.totalOrders.toString()],
            ['Cancelled/Failed Orders', data.summary.cancelledOrders.toString()],
            ['Average Order Value', `PKR ${data.summary.averageOrderValue.toLocaleString()}`],
          ],
          theme: 'striped',
          headStyles: { fillColor: [15, 23, 42] }
        });

        // Delivered Orders
        doc.text("Delivered Orders Log", 14, (doc as any).lastAutoTable.finalY + 15);
        autoTable(doc, {
          startY: (doc as any).lastAutoTable.finalY + 20,
          head: [['Order #', 'Date', 'Customer', 'Items', 'Total (PKR)', 'Staff']],
          body: data.delivered.map((order: any) => [
            order.orderNumber,
            format(new Date(order.placedAt), "MMM dd, hh:mm a"),
            order.customerName,
            order.items.map((i: any) => `${i.quantity}x ${i.name}`).join(", "),
            order.totalAmount.toLocaleString(),
            order.placedBy?.name || 'Unknown'
          ]),
          theme: 'grid',
          headStyles: { fillColor: [16, 185, 129] } // Emerald
        });

        // Cancelled Orders
        if (data.cancelled.length > 0) {
          doc.addPage();
          doc.text("Cancelled & Failed Orders Log", 14, 22);
          autoTable(doc, {
            startY: 30,
            head: [['Order #', 'Date', 'Customer', 'Reason', 'Lost Value']],
            body: data.cancelled.map((order: any) => [
              order.orderNumber,
              format(new Date(order.placedAt), "MMM dd, hh:mm a"),
              order.customerName,
              order.cancellationReason || order.failureReason || 'N/A',
              `PKR ${order.totalAmount.toLocaleString()}`
            ]),
            theme: 'grid',
            headStyles: { fillColor: [239, 68, 68] } // Red
          });
        }

        doc.save(`${filename}.pdf`);
      } 
      else if (formatType === 'csv') {
        // Flatten orders for CSV
        const flatOrders = data.allOrders.map((order: any) => ({
          OrderNumber: order.orderNumber,
          PlacedAt: format(new Date(order.placedAt), "yyyy-MM-dd HH:mm:ss"),
          Customer: order.customerName,
          Phone: order.customerPhone || '',
          Status: order.status,
          Items: order.items.map((i: any) => `${i.quantity}x ${i.name}`).join("; "),
          Subtotal: order.subtotal,
          Discount: order.orderDiscount ? order.orderDiscount.value : 0,
          TotalAmount: order.totalAmount,
          PlacedBy: order.placedBy?.name || '',
          CancellationReason: order.cancellationReason || ''
        }));
        
        const csv = Papa.unparse(flatOrders);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = `${filename}.csv`;
        link.click();
      }
      else if (formatType === 'json') {
        const jsonString = JSON.stringify(data, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = `${filename}.json`;
        link.click();
      }

    } catch (err) {
      console.error(err);
      alert("Failed to generate report. Please try again.");
    } finally {
      setGenerating(null);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-4xl font-black tracking-tight text-black">Audit Reports</h2>
        <p className="text-lg text-slate-600 mt-1 font-black">Generate detailed forensic-grade records of all system activity.</p>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        <Card className="border border-slate-100 shadow-xl shadow-black/5 bg-white rounded-2xl">
          <CardHeader>
            <CardTitle className="text-xl font-black text-black">Report Builder</CardTitle>
            <CardDescription className="text-slate-500 font-black">Select a date range and format to export.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-black text-slate-700 ml-1 uppercase tracking-widest">From Date</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input 
                    type="date" 
                    className="pl-10 h-12 rounded-xl bg-slate-50 border-slate-200 text-black font-black" 
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-black text-slate-700 ml-1 uppercase tracking-widest">To Date</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input 
                    type="date" 
                    className="pl-10 h-12 rounded-xl bg-slate-50 border-slate-200 text-black font-black" 
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-3 pt-4">
              <Button 
                className="w-full justify-between h-14 text-base font-black shadow-lg shadow-indigo-500/10 bg-indigo-600 hover:bg-indigo-700 text-white border-none rounded-2xl px-6" 
                onClick={() => generateReport('pdf')}
                disabled={generating !== null}
              >
                <div className="flex items-center gap-3">
                  <FileDown className="h-5 w-5" strokeWidth={3} />
                  Export PDF Report
                </div>
                {generating === 'pdf' ? <Loader2 className="h-5 w-5 animate-spin" /> : <ArrowRight className="h-5 w-5" strokeWidth={3} />}
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-between h-14 text-base font-black border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:text-black rounded-2xl px-6" 
                onClick={() => generateReport('csv')}
                disabled={generating !== null}
              >
                <div className="flex items-center gap-3">
                  <FileSpreadsheet className="h-5 w-5 text-emerald-600" strokeWidth={3} />
                  Export CSV Spreadsheet
                </div>
                {generating === 'csv' ? <Loader2 className="h-5 w-5 animate-spin" /> : <ArrowRight className="h-5 w-5" strokeWidth={3} />}
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-between h-14 text-base font-black border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:text-black rounded-2xl px-6" 
                onClick={() => generateReport('json')}
                disabled={generating !== null}
              >
                <div className="flex items-center gap-3">
                  <FileJson className="h-5 w-5 text-blue-600" strokeWidth={3} />
                  Export Raw JSON Data
                </div>
                {generating === 'json' ? <Loader2 className="h-5 w-5 animate-spin" /> : <ArrowRight className="h-5 w-5" strokeWidth={3} />}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-slate-100 shadow-xl shadow-black/5 bg-white rounded-2xl">
          <CardHeader>
            <CardTitle className="text-xl font-black text-black">Included Sections</CardTitle>
            <CardDescription className="text-slate-500 font-black">All reports generated contain the following data points:</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-4">
              {[
                { title: "Financial Summary", desc: "Gross revenue, net revenue, and average order values." },
                { title: "Delivered Orders Log", desc: "Complete table of every successful sale." },
                { title: "Cancelled & Failed Logs", desc: "Records of lost revenue with reasons." },
                { title: "Staff Activity", desc: "Breakdown of performance by Counter A & B staff." },
                { title: "Complete Action Log", desc: "Chronological list of all Admin mutations." },
              ].map((item, i) => (
                <li key={i} className="flex gap-5">
                  <div className="h-10 w-10 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-sm font-black text-indigo-600 flex-shrink-0 shadow-sm">
                    {i + 1}
                  </div>
                  <div>
                    <p className="text-base font-black text-black">{item.title}</p>
                    <p className="text-sm text-slate-500 font-black mt-0.5">{item.desc}</p>
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
