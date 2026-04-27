"use client";

import { useState, useRef } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle, Loader2, Shield, UtensilsCrossed, ClipboardList, ArrowRight } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const passwordRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const roles = [
    { name: "Admin", email: "Admin@sales.com", icon: Shield, color: "from-purple-500 to-indigo-600", bg: "bg-indigo-50", text: "text-indigo-600" },
    { name: "Order", email: "Order@sales.com", icon: ClipboardList, color: "from-blue-400 to-cyan-500", bg: "bg-blue-50", text: "text-blue-600" },
    { name: "Cooking", email: "Cooking@sales.com", icon: UtensilsCrossed, color: "from-orange-400 to-red-500", bg: "bg-orange-50", text: "text-orange-600" }
  ];

  const handleRoleSelect = (roleEmail: string) => {
    setEmail(roleEmail);
    // Auto-focus password field when a role is clicked
    setTimeout(() => passwordRef.current?.focus(), 50);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (res?.error) {
        setError("Invalid email or password. Please try again.");
      } else {
        router.refresh();
        router.push("/");
      }
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4 sm:p-8 relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-br from-slate-50 to-white skew-y-3 -translate-y-24 z-0"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-orange-100 rounded-full blur-3xl z-0"></div>

      <div className="w-full max-w-5xl grid lg:grid-cols-2 gap-8 lg:gap-16 z-10 items-center">
        
        {/* Left Side: Branding & Roles */}
        <div className="space-y-10">
          <div>
            <div className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-br from-orange-400 to-red-500 p-4 shadow-xl shadow-orange-500/30 mb-6 transform -rotate-6">
              <span className="text-4xl font-black text-white leading-none block">SN</span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-black mb-4 drop-shadow-sm">
              Snaccident
              <br />
              <span className="text-orange-500">Sales System</span>
            </h1>
            <p className="text-slate-600 text-lg max-w-md font-black">
              Select your designated portal role to quickly auto-fill your email, then enter your secure password.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {roles.map((role) => (
              <button
                key={role.name}
                type="button"
                onClick={() => handleRoleSelect(role.email)}
                className={`group relative overflow-hidden rounded-2xl border-2 transition-all duration-300 text-left p-5
                  ${email === role.email 
                    ? `border-transparent shadow-2xl scale-105 bg-gradient-to-br ${role.color}` 
                    : 'border-slate-100 bg-slate-50 hover:border-slate-200 hover:shadow-xl'
                  }`}
              >
                <div className={`mb-4 inline-flex rounded-xl p-3 transition-colors duration-300
                  ${email === role.email ? 'bg-white/20 text-white' : `bg-indigo-50 text-indigo-600`}
                `}>
                  <role.icon className="h-6 w-6" strokeWidth={2.5} />
                </div>
                <h3 className={`text-lg font-black transition-colors duration-300 ${email === role.email ? 'text-white' : 'text-slate-900'}`}>
                  {role.name}
                </h3>
              </button>
            ))}
          </div>
        </div>

        {/* Right Side: Login Form */}
        <Card className="w-full shadow-2xl border border-slate-100 bg-white rounded-3xl overflow-hidden">
          <div className="h-2 w-full bg-gradient-to-r from-orange-500 via-red-500 to-indigo-500"></div>
          <CardContent className="p-8 sm:p-10">
            <div className="mb-8">
              <h2 className="text-3xl font-black text-black">Secure Login</h2>
              <p className="text-slate-500 text-sm mt-2 font-black uppercase tracking-wider">Authentication Required</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="flex items-center gap-3 rounded-xl bg-red-50 p-4 text-sm font-bold text-red-600 border border-red-100 animate-in fade-in slide-in-from-top-2">
                  <AlertCircle className="h-5 w-5 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}
              
              <div className="space-y-2.5">
                <label className="text-sm font-black text-slate-700 ml-1 uppercase tracking-widest" htmlFor="email">
                  Email Address
                </label>
                <Input
                  id="email"
                  placeholder="name@example.com"
                  type="email"
                  autoCapitalize="none"
                  autoComplete="email"
                  autoCorrect="off"
                  disabled={loading}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-14 rounded-2xl bg-slate-50 border-slate-200 focus-visible:ring-indigo-500 text-black text-base px-6 font-black"
                  required
                />
              </div>

              <div className="space-y-2.5">
                <div className="flex items-center justify-between ml-1">
                  <label className="text-sm font-black text-slate-700 uppercase tracking-widest" htmlFor="password">
                    Password
                  </label>
                </div>
                <div className="relative">
                  <Input
                    ref={passwordRef}
                    id="password"
                    name="new-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••••••"
                    autoComplete="off"
                    disabled={loading}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-14 rounded-2xl bg-slate-50 border-slate-200 focus-visible:ring-indigo-500 text-black text-base px-6 pr-14 font-black"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none transition-colors"
                    disabled={loading}
                  >
                    {showPassword ? (
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-.722-3.25"/><path d="M2 8a10.645 10.645 0 0 0 20 0"/><path d="m20 15-1.726-2.05"/><path d="m4 15 1.726-2.05"/><path d="m9 18 .722-3.25"/></svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
                    )}
                  </button>
                </div>
              </div>

              <Button 
                className="w-full h-14 rounded-2xl text-lg font-black bg-slate-900 text-white hover:bg-black shadow-xl shadow-black/10 transition-all active:scale-[0.98] group mt-6 border-none" 
                type="submit" 
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                ) : (
                  <>
                    Access Dashboard
                    <ArrowRight className="ml-2 h-6 w-6 group-hover:translate-x-1 transition-transform" strokeWidth={3} />
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
