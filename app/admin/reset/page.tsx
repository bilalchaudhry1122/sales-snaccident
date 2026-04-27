"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AlertCircle, ShieldAlert, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function SystemResetPage() {
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [resetStep, setResetStep] = useState(1);
  const [adminPassword, setAdminPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      } else {
        alert(data.error || "Invalid OTP");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-10 max-w-4xl mx-auto relative">
      <div>
        <h2 className="text-4xl font-black tracking-tight text-slate-900">System Reset</h2>
        <p className="text-lg text-slate-500 mt-1 font-medium">Manage critical system data and perform factory resets.</p>
      </div>

      <div className="pt-4 border-t border-red-200">
        <h3 className="text-sm font-black text-red-500 uppercase tracking-widest mb-4 flex items-center gap-2">
          <ShieldAlert className="h-4 w-4" /> Danger Zone
        </h3>
        <Card className="border border-red-200 shadow-sm bg-red-50/30">
          <CardContent className="p-6 flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h4 className="text-xl font-bold text-slate-900">Factory Reset System</h4>
              <p className="text-slate-500 text-sm mt-1 max-w-xl">
                Permanently delete all Orders, Sales, and Audit Logs. This will reset the system's transactional state to zero. This action is irreversible.
              </p>
            </div>
            <Button variant="destructive" className="font-bold shadow-lg shadow-red-500/20" onClick={() => setIsResetModalOpen(true)}>
              Reset Entire System
            </Button>
          </CardContent>
        </Card>
      </div>

      {isResetModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <Card className="w-full max-w-md border-red-200 shadow-2xl rounded-2xl overflow-hidden">
            <CardHeader className="bg-red-50 border-b border-red-100 flex flex-row items-start justify-between pb-4">
              <div>
                <CardTitle className="text-xl font-black text-red-600 flex items-center gap-2">
                  <AlertCircle className="h-5 w-5" /> Confirm System Wipe
                </CardTitle>
                <CardDescription className="text-red-800/70 font-medium mt-1">
                  You are about to irreversibly delete all system data.
                </CardDescription>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setIsResetModalOpen(false)} className="text-red-500 hover:text-red-700 hover:bg-red-100 rounded-full h-8 w-8">
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>

            {resetStep === 1 ? (
              <form onSubmit={handleRequestOtp}>
                <CardContent className="p-6 space-y-4">
                  <div className="bg-orange-50 border border-orange-200 text-orange-800 text-sm p-3 rounded-lg font-medium">
                    To proceed, please enter your Admin password. We will send a 2FA code to your registered email address.
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Admin Password</label>
                    <Input 
                      required 
                      type="password"
                      placeholder="Enter your password" 
                      className="h-11 rounded-xl"
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                    />
                  </div>
                </CardContent>
                <div className="border-t border-slate-100 p-4 flex justify-end gap-3 bg-slate-50/50">
                  <Button type="button" variant="ghost" onClick={() => setIsResetModalOpen(false)} className="font-bold">Cancel</Button>
                  <Button type="submit" variant="destructive" disabled={isSubmitting} className="font-bold px-6 shadow-lg shadow-red-500/20">
                    {isSubmitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                    Request Code
                  </Button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleConfirmReset}>
                <CardContent className="p-6 space-y-4">
                  <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm p-3 rounded-lg font-medium">
                    A 6-digit confirmation code has been sent to your email. It will expire in 10 minutes.
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">6-Digit Code</label>
                    <Input 
                      required 
                      type="text"
                      maxLength={6}
                      placeholder="000000" 
                      className="h-14 rounded-xl text-center text-2xl font-black tracking-[0.2em]"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                    />
                  </div>
                </CardContent>
                <div className="border-t border-slate-100 p-4 flex justify-end gap-3 bg-slate-50/50">
                  <Button type="button" variant="ghost" onClick={() => { setIsResetModalOpen(false); setResetStep(1); setOtp(""); setAdminPassword(""); }} className="font-bold">Cancel</Button>
                  <Button type="submit" variant="destructive" disabled={isSubmitting || otp.length !== 6} className="font-bold px-6 shadow-lg shadow-red-500/20">
                    {isSubmitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                    Confirm Wipe
                  </Button>
                </div>
              </form>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
