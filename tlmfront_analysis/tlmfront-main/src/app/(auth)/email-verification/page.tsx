"use client";

import React, { useState, useEffect } from 'react';
import { Mail, CheckCircle2, ArrowRight, Loader2, LogOut, ShieldCheck, RefreshCw } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import API from '@/api/axios';

export default function EmailVerificationPage() {
    const user = useAuthStore((state) => state.user);
    const clearAuth = useAuthStore((state) => state.clearAuth);
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);
    const [error, setError] = useState("");

    const handleRefresh = async () => {
        setLoading(true);
        try {
            const res = await API.post("/api/auth/refresh/");
            if (res.data?.user?.is_email_verified) {
                useAuthStore.getState().setAuth(res.data.access, res.data.user);
                window.location.replace("/home");
            }
        } catch (err) {
            console.error("Status check failed", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const interval = setInterval(async () => {
            try {
                const res = await API.post("/api/auth/refresh/");
                if (res.data?.user?.is_email_verified) {
                    useAuthStore.getState().setAuth(res.data.access, res.data.user);
                    window.location.replace("/home");
                }
            } catch (e) {}
        }, 10000);
        return () => clearInterval(interval);
    }, []);

    const handleResend = async () => {
        setLoading(true);
        setError("");
        try {
            await API.post("/api/auth/resend-email-verification/");
            setSent(true);
            setTimeout(() => setSent(false), 5000);
        } catch (err: any) {
            setError(err.response?.data?.error || "Failed to resend email. Please try again later.");
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        clearAuth();
        window.location.replace("/login");
    };

    return (
        <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-6 font-sans selection:bg-teal-500/30">
            <div className="w-full max-w-md relative group">
                {/* Glow Effect */}
                <div className="absolute -inset-1 bg-gradient-to-r from-teal-500 to-emerald-600 rounded-[32px] blur opacity-20 group-hover:opacity-30 transition duration-1000"></div>
                
                <div className="relative bg-zinc-900 border border-zinc-800 rounded-[32px] p-8 md:p-12 shadow-2xl flex flex-col items-center text-center">
                    
                    {/* Icon Header */}
                    <div className="relative mb-8">
                        <div className="w-20 h-20 bg-teal-500/10 rounded-full flex items-center justify-center border border-teal-500/20">
                            <Mail className="w-10 h-10 text-teal-400" />
                        </div>
                        <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-zinc-900 border border-zinc-800 rounded-full flex items-center justify-center shadow-lg">
                            <ShieldCheck className="w-4 h-4 text-emerald-500" />
                        </div>
                    </div>

                    <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight mb-4">
                        Verify Your Email
                    </h1>
                    
                    <p className="text-zinc-400 text-sm md:text-base leading-relaxed mb-8">
                        We've sent a secure verification link to <span className="text-zinc-100 font-bold">{user?.email || "your email"}</span>. Please check your inbox to activate your account.
                    </p>

                    {/* Refresh Status Action */}
                    <button
                        onClick={handleRefresh}
                        disabled={loading}
                        className="w-full py-4 mb-3 bg-teal-500/10 text-teal-400 border border-teal-500/20 rounded-2xl flex items-center justify-center gap-3 font-bold text-sm uppercase tracking-widest hover:bg-teal-500/20 transition-all active:scale-95 disabled:opacity-50"
                    >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <RefreshCw className="w-5 h-5" />}
                        Already Verified? Check Status
                    </button>

                    {/* Resend Action */}
                    <button
                        onClick={handleResend}
                        disabled={loading || sent}
                        className={`w-full py-4 rounded-2xl flex items-center justify-center gap-3 font-bold text-sm uppercase tracking-widest transition-all duration-300 ${
                            sent 
                            ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" 
                            : "bg-zinc-100 text-zinc-950 hover:bg-white hover:scale-[1.02] active:scale-[0.98]"
                        } disabled:opacity-70 disabled:cursor-not-allowed shadow-xl shadow-teal-900/10`}
                    >
                        {loading ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : sent ? (
                            <>
                                <CheckCircle2 className="w-5 h-5" />
                                Email Resent
                            </>
                        ) : (
                            <>
                                Resend Verification
                                <ArrowRight className="w-5 h-5" />
                            </>
                        )}
                    </button>

                    {error && (
                        <p className="mt-4 text-xs font-bold text-rose-500 bg-rose-500/10 px-4 py-2 rounded-lg border border-rose-500/20">
                            {error}
                        </p>
                    )}

                    {/* Logout/Back Action */}
                    <button 
                        onClick={handleLogout}
                        className="mt-10 flex items-center gap-2 text-zinc-500 hover:text-zinc-300 transition-colors group text-xs font-bold uppercase tracking-widest"
                    >
                        <LogOut className="w-4 h-4" />
                        Sign out and try again
                    </button>
                </div>

                <p className="text-center mt-8 text-zinc-600 text-xs font-medium">
                    Can't find the email? Check your spam folder or wait a few minutes.
                </p>
            </div>
        </div>
    );
}
