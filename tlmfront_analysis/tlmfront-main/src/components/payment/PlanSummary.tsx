"use client";

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Check, CreditCard, AlertCircle, Loader2, ArrowLeft } from 'lucide-react';
import tlmApis from '@/api/tlmapis';
import API from '@/api/axios';
import { useAuthStore } from '@/store/authStore';
import PayButton from './PayButton';

interface PlanDetails {
    id: string;
    name: string;
    displayname: string;
    price: number;
    currency: string;
    duration_days: number;
    description: string;
    plan_type: string;
    max_portfolios: number;
    real_time_data: boolean;
    advanced_analytics: boolean;
    upgrade_payable_amount?: number;
    unused_credit_applied?: number;
    gst_percentage: number;
}

function PlanSummaryContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [loading, setLoading] = useState(true);
    const [plan, setPlan] = useState<PlanDetails | null>(null);
    const user = useAuthStore((state) => state.user);

    const [couponCode, setCouponCode] = useState("");
    const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
    const [couponDiscount, setCouponDiscount] = useState<number>(0);
    const [couponError, setCouponError] = useState<string | null>(null);
    const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);

    const applyCoupon = async () => {
        if (!couponCode || !plan) return;
        setIsApplyingCoupon(true);
        setCouponError(null);
        try {
            const trimmedCoupon = couponCode.trim();
            const res = await API.post("/api/apply/coupon/", {
                coupon: trimmedCoupon,
                plan_id: plan.id
            });
            setAppliedCoupon(trimmedCoupon);
            setCouponDiscount(res.data.discount);
        } catch (err: any) {
            setCouponError(err.response?.data?.error || "Failed to apply coupon");
            setAppliedCoupon(null);
            setCouponDiscount(0);
        } finally {
            setIsApplyingCoupon(false);
        }
    };

    const removeCoupon = async () => {
        try {
            await API.post("/api/remove/coupon/", { plan_id: plan?.id });
            setAppliedCoupon(null);
            setCouponCode("");
            setCouponDiscount(0);
            setCouponError(null);
        } catch (err) {
            console.error("Failed to remove coupon", err);
        }
    };

    useEffect(() => {
        const fetchPlan = async () => {
            const planId = searchParams.get('id') || (typeof window !== 'undefined' ? localStorage.getItem('pending_plan_id') : '');
            if (!planId) {
                router.push('/home');
                return;
            }

            try {
                const res = await tlmApis.validatePlan(planId);
                setPlan(res.data.plan || null); 
                setLoading(false);
            } catch (err: any) {
                console.error("Failed to fetch plan details", err);
                setLoading(false);
            }
        };

        fetchPlan();
    }, [router, searchParams]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] text-zinc-400">
                <Loader2 className="w-8 h-8 text-teal-400 animate-spin mb-4" />
                <p className="text-xs font-bold uppercase tracking-wider">Loading Plan Frameworks...</p>
            </div>
        );
    }

    if (!plan) {
        return (
            <div className="max-w-md mx-auto text-center py-20 text-zinc-100">
                <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-4" />
                <h2 className="text-xl font-bold mb-2">Plan Not Identified</h2>
                <p className="text-zinc-400 text-sm mb-6">Could not resolve subscription selection milestones.</p>
                <button 
                    onClick={() => router.push('/home')} 
                    className="text-teal-400 text-sm font-bold hover:underline"
                >
                    Back to Dashboard
                </button>
            </div>
        );
    }

    const baseAmount = Number(plan.upgrade_payable_amount !== undefined ? plan.upgrade_payable_amount : plan.price);
    const amountAfterCoupon = Math.max(0, baseAmount - couponDiscount);
    const gstAmount = amountAfterCoupon * (Number(plan.gst_percentage || 18) / 100);
    const finalAmount = amountAfterCoupon + gstAmount;

    return (
        <div className="max-w-5xl mx-auto py-12 px-6 font-sans text-zinc-100">
            <button 
                onClick={() => router.push('/profile')}
                className="flex items-center gap-2 text-zinc-500 hover:text-zinc-300 transition-colors mb-6 group"
            >
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                <span className="text-xs font-bold uppercase tracking-widest">Back to Profile</span>
            </button>
            <div className="flex flex-col gap-2 mb-10">
                <h1 className="text-3xl font-black tracking-tight bg-gradient-to-r from-zinc-100 to-zinc-500 bg-clip-text text-transparent">
                    Checkout Summary
                </h1>
                <p className="text-zinc-500 font-medium text-sm">Verify your algorithmic subscription metrics before deployment.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">
                {/* Left Side: Plan Details */}
                <div className="lg:col-span-3 space-y-6">
                    <div className="bg-zinc-900/40 border border-zinc-800/60 rounded-3xl p-8 shadow-2xl backdrop-blur-xl relative overflow-hidden group">
                        <div className="absolute -inset-px bg-gradient-to-r from-teal-500/10 to-indigo-500/10 rounded-3xl blur opacity-20 group-hover:opacity-40 transition-all duration-300 pointer-events-none" />
                        
                        <div className="flex justify-between items-start mb-8 relative z-10">
                            <div>
                                <span className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.2em]">Selected Tier</span>
                                <h2 className="text-2xl font-black text-zinc-100 mt-1">{plan.displayname || plan.name}</h2>
                            </div>
                            <div className="px-4 py-1.5 bg-zinc-950 border border-zinc-800/80 rounded-xl text-zinc-400 text-[10px] font-black uppercase tracking-widest shadow-inner">
                                {plan.plan_type}
                            </div>
                        </div>

                        <div className="space-y-8 relative z-10">
                            <div>
                                <h4 className="text-[10px] font-black uppercase text-zinc-500 tracking-[0.2em] mb-4">Package Entitlements</h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {plan.description ? plan.description.split('\n').filter(line => line.trim() !== "").map((line, i) => (
                                        <div key={i} className="flex items-center gap-3 bg-zinc-950/40 border border-zinc-800/40 p-4 rounded-2xl group/item hover:border-teal-500/30 transition-colors">
                                            <div className="w-5 h-5 rounded-full bg-teal-500/10 flex items-center justify-center border border-teal-500/20 group-hover/item:bg-teal-500/20 transition-colors">
                                                <Check className="w-3 h-3 text-teal-400" />
                                            </div>
                                            <span className="text-xs font-bold text-zinc-300">{line.trim()}</span>
                                        </div>
                                    )) : (
                                        <>
                                            <div className="flex items-center gap-3 bg-zinc-950/40 border border-zinc-800/40 p-4 rounded-2xl">
                                                <Check className="w-4 h-4 text-teal-400" />
                                                <span className="text-xs font-bold text-zinc-300">{plan.max_portfolios} Max Portfolios</span>
                                            </div>
                                            <div className="flex items-center gap-3 bg-zinc-950/40 border border-zinc-800/40 p-4 rounded-2xl">
                                                <Check className="w-4 h-4 text-teal-400" />
                                                <span className="text-xs font-bold text-zinc-300">Real-Time Data Access</span>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>

                            <div className="p-6 bg-zinc-950/60 rounded-2xl border border-zinc-800/60 border-dashed">
                                <div className="flex items-center gap-3 text-zinc-500 mb-2">
                                    <AlertCircle className="w-4 h-4" />
                                    <span className="text-[10px] font-black uppercase tracking-widest">Duration Policy</span>
                                </div>
                                <p className="text-xs text-zinc-400 font-medium leading-relaxed">
                                    This subscription will remain active for <span className="text-zinc-200 font-bold">{plan.duration_days} days</span> from the timestamp of successful gateway verification.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Side: Payment Summary */}
                <div className="lg:col-span-2">
                    <div className="bg-zinc-900/40 border border-zinc-800/60 rounded-3xl p-8 shadow-2xl backdrop-blur-xl sticky top-8 group">
                        <div className="absolute -inset-px bg-gradient-to-b from-teal-500/5 to-transparent rounded-3xl opacity-50 pointer-events-none" />
                        
                        <h2 className="text-lg font-black text-zinc-100 mb-8 relative z-10 flex items-center gap-2">
                            <CreditCard className="w-5 h-5 text-teal-400" />
                            Final Settlement
                        </h2>
                        
                        <div className="space-y-4 mb-8 relative z-10">
                            <div className="flex justify-between items-center text-xs font-bold text-zinc-500">
                                <span>Base Subscription</span>
                                <span className="text-zinc-300">{plan.currency} {Number(plan.price).toLocaleString()}</span>
                            </div>

                            {plan.upgrade_payable_amount !== undefined && (
                                <div className="flex justify-between items-center text-xs font-bold text-teal-400/80 bg-teal-500/5 p-3 rounded-xl border border-teal-500/10">
                                    <div className="flex flex-col">
                                        <span>Pro-rata Credits</span>
                                        <span className="text-[9px] opacity-60">Balance from previous tier</span>
                                    </div>
                                    <span>-{plan.currency} {Number(plan.unused_credit_applied).toLocaleString()}</span>
                                </div>
                            )}

                            {/* Coupon Section */}
                            <div className="pt-2">
                                {!appliedCoupon ? (
                                    <div className="flex flex-col gap-2">
                                        <div className="flex gap-2">
                                            <input 
                                                type="text" 
                                                placeholder="Enter Coupon Code" 
                                                value={couponCode}
                                                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                                                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2 text-xs font-bold text-zinc-300 focus:outline-none focus:border-teal-500/50 transition-colors uppercase placeholder:normal-case placeholder:font-normal"
                                            />
                                            <button 
                                                onClick={applyCoupon}
                                                disabled={!couponCode || isApplyingCoupon}
                                                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 disabled:opacity-50 font-bold text-xs rounded-xl transition-colors"
                                            >
                                                {isApplyingCoupon ? <Loader2 className="w-4 h-4 animate-spin" /> : "Apply"}
                                            </button>
                                        </div>
                                        {couponError && <span className="text-rose-400 text-[10px] font-bold px-1">{couponError}</span>}
                                    </div>
                                ) : (
                                    <div className="flex justify-between items-center text-xs font-bold text-emerald-400/80 bg-emerald-500/5 p-3 rounded-xl border border-emerald-500/10">
                                        <div className="flex flex-col">
                                            <span>Coupon Applied ({appliedCoupon})</span>
                                            <button onClick={removeCoupon} className="text-[9px] text-zinc-500 hover:text-zinc-300 text-left underline mt-0.5">Remove</button>
                                        </div>
                                        <span>-{plan.currency} {couponDiscount.toLocaleString()}</span>
                                    </div>
                                )}
                            </div>

                            <div className="h-px bg-zinc-800/60 w-full my-4" />

                            <div className="flex justify-between items-center text-xs font-bold text-zinc-400">
                                <span>Subtotal</span>
                                <span>{plan.currency} {amountAfterCoupon.toLocaleString()}</span>
                            </div>

                            <div className="flex justify-between items-center text-xs font-bold text-zinc-500">
                                <div className="flex items-center gap-1.5">
                                    <span>GST</span>
                                    <span className="text-[9px] bg-zinc-800 px-1.5 py-0.5 rounded text-zinc-400">{plan.gst_percentage}%</span>
                                </div>
                                <span>{plan.currency} {gstAmount.toLocaleString()}</span>
                            </div>

                            <div className="mt-8 p-6 bg-zinc-950/80 rounded-2xl border border-zinc-800 shadow-inner relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-1">
                                    <div className="w-20 h-20 bg-teal-500/5 blur-2xl rounded-full" />
                                </div>
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">Total Payable</span>
                                    <span className="text-xs font-bold text-teal-400">Secured</span>
                                </div>
                                <div className="flex items-baseline gap-1.5">
                                    <span className="text-3xl font-black text-zinc-100">{plan.currency} {Number(finalAmount).toLocaleString()}</span>
                                </div>
                            </div>
                        </div>

                        <div className="relative z-10">
                            <PayButton 
                                planId={plan.id}
                                amount={Number(finalAmount)}
                                coupon={appliedCoupon}
                                className="w-full py-4 bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-400 hover:to-teal-500 text-zinc-950 font-black text-xs uppercase tracking-widest rounded-2xl shadow-xl shadow-teal-900/20 active:scale-95 transition-all duration-200"
                                prefill={{
                                    email: user?.email,
                                    name: user?.username,
                                }}
                                onSuccess={async () => {
                                    if (typeof window !== 'undefined') localStorage.removeItem('pending_plan_id');
                                    try {
                                        // Force refresh authentication to update has_active_subscription in global state
                                        const response = await API.post("/api/auth/refresh/");
                                        if (response.data?.access) {
                                            useAuthStore.getState().setAuth(response.data.access, response.data.user);
                                        }
                                    } catch (e) {
                                        console.error("Auth refresh after payment failed", e);
                                    }
                                    // Full reload to clear any restricted UI states and redirect to dashboard
                                    window.location.replace('/home');
                                }}
                            />
                            <p className="text-[10px] text-zinc-500 text-center mt-4 font-bold uppercase tracking-widest opacity-60">
                                Encrypted Gateway Tunnel Active
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function PlanSummary() {
    return (
        <Suspense fallback={
            <div className="flex flex-col items-center justify-center min-h-[400px] text-zinc-400">
                <Loader2 className="w-8 h-8 text-teal-400 animate-spin mb-4" />
                <p className="text-xs font-bold uppercase tracking-wider">Initializing Secure Tunnel...</p>
            </div>
        }>
            <PlanSummaryContent />
        </Suspense>
    );
}
