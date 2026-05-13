"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle, XCircle, Loader2, CreditCard, ChevronRight } from 'lucide-react';
import { API } from '@/api/axios';

interface PayButtonProps {
    planId: string;
    amount: number;
    prefill?: {
        name?: string;
        email?: string;
    };
    coupon?: string | null;
    onSuccess?: (details: any) => void;
    onFailure?: (error: any) => void;
    className?: string;
}

type PaymentStatus = 'idle' | 'processing' | 'success' | 'error';

export default function PayButton({ planId, amount, prefill, coupon, onSuccess, onFailure, className = '' }: PayButtonProps) {
    const router = useRouter();
    const [status, setStatus] = useState<PaymentStatus>('idle');
    const [errorMessage, setErrorMessage] = useState('');

    const loadRazorpayScript = () => {
        return new Promise((resolve) => {
            const script = document.createElement('script');
            script.src = 'https://checkout.razorpay.com/v1/checkout.js';
            script.onload = () => resolve(true);
            script.onerror = () => resolve(false);
            document.body.appendChild(script);
        });
    };

    const handlePayment = async () => {
        setStatus('processing');
        setErrorMessage('');
        
        try {
            // 1. Create Order on Backend
            const orderRes = await API.post("/api/order/create/razorpay/", { 
                id: planId, 
                total_amount: amount,
                ...(coupon && { coupon })
            });
            
            const { order_id, amount: orderAmount, currency, razorpay_key_id } = orderRes.data;

            if (orderAmount === 0 || orderRes.data.status === 'Payment successful') {
                setStatus('success');
                if (onSuccess) onSuccess(orderRes.data);
                return;
            }

            // 2. Load Razorpay Script
            const isLoaded = await loadRazorpayScript();
            if (!isLoaded) {
                throw new Error('Razorpay checkout toolkit failed to initialize.');
            }

            // 3. Open Checkout Options
            const options = {
                key: razorpay_key_id || 'rzp_test_dummy_key',
                amount: orderAmount,
                currency: currency || 'INR',
                name: "TimelessMoney",
                description: "Algorithmic Subscription Plan",
                order_id: order_id,
                handler: async function (response: any) {
                    setStatus('processing');
                    try {
                        const verifyRes = await API.post("/api/verify/razorpay/", {
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature
                        });
                        
                        if (verifyRes.data && verifyRes.data.status === 'Payment successful') {
                            setStatus('success');
                            if (onSuccess) onSuccess(verifyRes.data);
                        } else {
                            throw new Error('Verification request yielded empty metrics.');
                        }
                    } catch (verifyErr: any) {
                        setStatus('error');
                        setErrorMessage(verifyErr.response?.data?.error || 'Payment verification failed.');
                        if (onFailure) onFailure(verifyErr);
                    }
                },
                prefill: {
                    name: prefill?.name || '',
                    email: prefill?.email || '',
                },
                theme: {
                    color: "#14b8a6"
                },
                modal: {
                    ondismiss: function() {
                        setStatus('idle');
                    }
                }
            };

            const rzp = new (window as any).Razorpay(options);
            rzp.open();

        } catch (err: any) {
            console.error("Payment gateway failure:", err);
            setStatus('error');
            setErrorMessage(err.response?.data?.error || err.message || 'Payment initialization halted.');
            if (onFailure) onFailure(err);
        }
    };

    useEffect(() => {
        if (status === 'success') {
            const timer = setTimeout(() => {
                router.push('/home');
            }, 2000);
            return () => clearTimeout(timer);
        }
    }, [status, router]);

    return (
        <>
            <button
                onClick={handlePayment}
                disabled={status === 'processing'}
                className={`flex items-center justify-center gap-3 px-8 py-4 bg-gradient-to-r from-teal-500 to-teal-600 text-zinc-950 font-bold rounded-xl shadow-xl hover:from-teal-400 hover:to-teal-500 active:scale-[0.98] transition-all disabled:opacity-50 disabled:scale-100 ${className}`}
            >
                {status === 'processing' ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                    <CreditCard className="w-5 h-5" />
                )}
                <span>{status === 'processing' ? 'Preparing Checkout...' : 'Secure Payment'}</span>
                <ChevronRight className="w-4 h-4 ml-1 opacity-50" />
            </button>

            {/* Status Overlays */}
            {status !== 'idle' && status !== 'processing' && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-zinc-950/60 backdrop-blur-sm" onClick={() => setStatus('idle')} />
                    
                    <div className="relative bg-zinc-900 border border-zinc-800/60 max-w-sm w-full rounded-2xl shadow-2xl p-8 text-center text-zinc-100">
                        {status === 'success' ? (
                            <>
                                <div className="w-16 h-16 bg-teal-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-teal-500/20 shadow-inner">
                                    <CheckCircle className="w-8 h-8 text-teal-400" />
                                </div>
                                <h3 className="text-2xl font-bold text-zinc-100 mb-2">Success!</h3>
                                <p className="text-zinc-400 text-sm mb-8">Subscription parameters configured successfully.</p>
                                
                                <button 
                                    onClick={() => router.push('/home')}
                                    className="w-full py-3.5 bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-400 hover:to-teal-500 text-zinc-950 font-bold rounded-xl transition-all duration-200 shadow-lg"
                                >
                                    Go to Dashboard
                                </button>
                            </>
                        ) : (
                            <>
                                <div className="w-16 h-16 bg-rose-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-rose-500/20 shadow-inner">
                                    <XCircle className="w-8 h-8 text-rose-400" />
                                </div>
                                <h3 className="text-2xl font-bold text-zinc-100 mb-2">Transaction Halted</h3>
                                <p className="text-zinc-400 text-sm mb-8">{errorMessage || "The request could not be processed."}</p>
                                
                                <div className="flex flex-col gap-3">
                                    <button 
                                        onClick={() => setStatus('idle')}
                                        className="w-full py-3 bg-teal-500/20 hover:bg-teal-500/30 text-teal-300 border border-teal-500/30 font-bold rounded-xl transition-all"
                                    >
                                        Try Again
                                    </button>
                                    <button 
                                        onClick={() => setStatus('idle')}
                                        className="w-full py-3 bg-zinc-800 text-zinc-400 hover:bg-zinc-700/80 font-bold rounded-xl transition-all"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
        </>
    );
}
