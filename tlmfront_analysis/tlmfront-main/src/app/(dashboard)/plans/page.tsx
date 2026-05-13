'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import tlmApis from '@/api/tlmapis';
import Link from 'next/link';

interface PlanDetails {
  id: string;
  name: string;
  displayname: string;
  description: string;
  currency: string;
  price: string;
  duration_days: number;
  max_portfolios: number;
  real_time_data: boolean;
  advanced_analytics: boolean;
  upgrade_payable_amount?: number;
  gst_percentage: number;
  plan_type: 'free' | 'paid' | 'custom';
}

export default function PlansPage() {
  const [plans, setPlans] = useState<PlanDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, clearAuth } = useAuthStore();
  const router = useRouter();

  const fetchPlans = async () => {
    try {
      const subRes = await tlmApis.getUpgradeDetails();
      setPlans(subRes.data.plans || []);
    } catch (e) {
      console.error("Error fetching plans", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const handleLogout = async () => {
    try {
      await tlmApis.logout();
    } catch (e) {
      console.error('Logout error', e);
    } finally {
      clearAuth();
      router.push('/login');
    }
  };

  const getDurationSuffix = (days: number) => {
    if (days < 30) return `/${days}d`;
    if (days < 365) return `/${Math.round(days / 30)}mo`;
    return `/${Math.round(days / 365)}yr`;
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-zinc-400">
        <div className="animate-spin h-8 w-8 border-2 border-teal-400 border-t-transparent rounded-full mb-4"></div>
        <span className="text-sm font-medium">Loading Plans...</span>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex flex-col gap-1 mb-12">
        <div className="flex justify-between items-center">
          <h1 className="text-4xl font-black tracking-tight text-zinc-100 bg-gradient-to-r from-zinc-100 to-zinc-400 bg-clip-text text-transparent">
            Choose Your Plan
          </h1>
          <button 
            onClick={handleLogout}
            className="px-4 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 font-bold text-xs uppercase tracking-wider rounded-xl active:scale-98 transition-all duration-200"
          >
            Logout
          </button>
        </div>
        <p className="text-zinc-500 font-medium text-lg mt-2">Unlock the full power of TimelessMoney with a subscription.</p>
        {!user?.has_active_subscription && (
           <div className="mt-4 px-4 py-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-center gap-3">
             <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
             <p className="text-amber-400 text-sm font-bold">You need an active subscription to access the dashboard. Please select a plan below.</p>
           </div>
        )}
      </div>

      {plans.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan: PlanDetails) => (
            <div key={plan.id} className="bg-zinc-900/60 border border-zinc-800/80 rounded-3xl p-8 shadow-2xl relative flex flex-col items-center group hover:border-teal-500/40 transition-all duration-300">
              <div className="absolute -inset-px bg-gradient-to-r from-teal-500/10 to-indigo-500/10 rounded-3xl blur opacity-20 group-hover:opacity-40 transition-all duration-300 pointer-events-none" />
              <span className="text-zinc-300 text-sm font-black uppercase tracking-widest text-center h-8 flex items-center justify-center relative z-10">
                {plan.displayname || plan.name}
              </span>
              <div className="mt-4 flex items-baseline gap-1 relative z-10">
                <span className="text-5xl font-black text-zinc-100">
                  {plan.currency === 'INR' ? '₹' : '$'}
                  {Number(plan.price).toFixed(0)}
                </span>
                <span className="text-zinc-500 text-sm font-bold whitespace-nowrap">
                  {getDurationSuffix(plan.duration_days)} <span className="text-[10px] ml-1 opacity-70">+ {Number(plan.gst_percentage).toFixed(0)}% GST</span>
                </span>
              </div>
              
              <div className="w-full border-t border-zinc-800/60 my-8 relative z-10" />

              <ul className="w-full text-left space-y-4 mb-10 text-sm font-bold text-zinc-400 flex-1 relative z-10">
                {plan.description ? plan.description.split('\n').filter((line: string) => line.trim() !== "").map((line: string, i: number) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="text-teal-400 mt-1">✓</span> <span className="leading-relaxed">{line.trim()}</span>
                  </li>
                )) : (
                  <>
                    <li className="flex items-center gap-3">
                      <span className="text-teal-400">✓</span> {plan.max_portfolios} Max Portfolios
                    </li>
                    <li className="flex items-center gap-3">
                      <span className={plan.real_time_data ? "text-teal-400" : "text-zinc-600"}>✓</span> Real-Time Data
                    </li>
                    <li className="flex items-center gap-3">
                      <span className={plan.advanced_analytics ? "text-teal-400" : "text-zinc-600"}>✓</span> Advanced Analytics
                    </li>
                  </>
                )}
              </ul>

              <Link 
                href={`/payment/summary?id=${plan.id}`} 
                className="w-full mt-auto text-center py-4 bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-400 hover:to-teal-500 text-zinc-950 font-extrabold text-sm uppercase tracking-wider rounded-2xl shadow-xl transform active:scale-98 transition-all duration-200 relative z-10"
              >
                {plan.plan_type === 'free' ? 'Start Free Trial' : 'Purchase Now'}
              </Link>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-zinc-500 text-sm font-medium py-20 flex items-center justify-center border border-zinc-800/50 border-dashed rounded-3xl bg-zinc-900/10">
          No subscription plans available at this moment.
        </div>
      )}
    </div>
  );
}
