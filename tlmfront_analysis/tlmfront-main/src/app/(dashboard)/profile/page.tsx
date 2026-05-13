'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import tlmApis from '@/api/tlmapis';
import Link from 'next/link';

interface UserDetails {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  mobile: string;
  is_email_verified: boolean;
}

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
}

export default function ProfilePage() {
  const [user, setUser] = useState<UserDetails | null>(null);
  const [currentPlan, setCurrentPlan] = useState<PlanDetails | null>(null);
  const [upgradePlans, setUpgradePlans] = useState<PlanDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const router = useRouter();

  const fetchProfileData = async () => {
    try {
      // Fetch User Details
      const userRes = await tlmApis.getMe();
      setUser(userRes.data);
      // Fetch Subscriptions Details
      const subRes = await tlmApis.getUpgradeDetails();
      setCurrentPlan(subRes.data.current_plan_details);
      setUpgradePlans(subRes.data.plans || []);
    } catch (e) {
      console.error("Error fetching profile data", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfileData();
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
        <span className="text-sm font-medium">Loading Profile...</span>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex flex-col gap-1 mb-8">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-black tracking-tight text-zinc-100 bg-gradient-to-r from-zinc-100 to-zinc-400 bg-clip-text text-transparent">
            Profile Settings
          </h1>
          <button 
            onClick={handleLogout}
            className="px-4 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 font-bold text-xs uppercase tracking-wider rounded-xl active:scale-98 transition-all duration-200"
          >
            Logout
          </button>
        </div>
        <p className="text-zinc-500 font-medium text-sm">Manage your personal details and subscription plan.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
        {/* User Details Card */}
        <div className="bg-zinc-900/40 border border-zinc-800/60 rounded-3xl p-8 relative overflow-hidden group">
          <div className="absolute -inset-px bg-gradient-to-r from-teal-500/10 to-indigo-500/10 rounded-3xl blur opacity-20 group-hover:opacity-40 transition-all duration-300 pointer-events-none" />
          <h2 className="text-xl font-bold tracking-tight text-zinc-200 mb-6">Personal Details</h2>
          
          <div className="space-y-4 relative z-10">
            <div>
              <label className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Full Name</label>
              <div className="text-sm font-bold text-zinc-300 mt-1">{user?.first_name} {user?.last_name}</div>
            </div>
            <div>
              <label className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Username</label>
              <div className="text-sm font-bold text-zinc-300 mt-1">@{user?.username}</div>
            </div>
            <div>
              <label className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Email</label>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-sm font-bold text-zinc-300">{user?.email}</span>
                {user?.is_email_verified && <span className="text-[10px] bg-teal-500/20 text-teal-400 px-2 py-0.5 rounded uppercase font-bold border border-teal-500/30">Verified</span>}
              </div>
            </div>
            <div>
              <label className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Mobile</label>
              <div className="text-sm font-bold text-zinc-300 mt-1">{user?.mobile || "Not provided"}</div>
            </div>
          </div>
        </div>

        {/* Current Plan Card */}
        <div className="bg-zinc-900/40 border border-zinc-800/60 rounded-3xl p-8 relative overflow-hidden group">
          <div className="absolute -inset-px bg-gradient-to-r from-teal-500/10 to-indigo-500/10 rounded-3xl blur opacity-20 group-hover:opacity-40 transition-all duration-300 pointer-events-none" />
          <h2 className="text-xl font-bold tracking-tight text-zinc-200 mb-6">Current Plan</h2>
          
          {currentPlan ? (
            <div className="flex flex-col h-[calc(100%-3rem)] relative z-10">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <span className="text-zinc-300 text-sm font-black uppercase tracking-widest">{currentPlan.displayname || currentPlan.name}</span>
                  <div className="mt-2 flex items-baseline gap-1">
                    <span className="text-3xl font-black text-zinc-100">
                      {currentPlan.currency === 'INR' ? '₹' : '$'}{Number(currentPlan.price).toFixed(0)}
                    </span>
                    <span className="text-zinc-500 text-xs font-bold whitespace-nowrap">
                      {getDurationSuffix(currentPlan.duration_days)}
                    </span>
                  </div>
                </div>
                <div className="px-3 py-1 bg-teal-500/10 border border-teal-500/30 rounded-lg text-teal-400 text-[10px] font-bold uppercase tracking-widest">
                  Active
                </div>
              </div>
              
              <ul className="text-left space-y-2 mb-8 text-xs font-bold text-zinc-400 flex-1">
                 <li className="flex items-center gap-2">
                   <span className="text-teal-400">✓</span> {currentPlan.max_portfolios} Max Portfolios
                 </li>
                 {currentPlan.real_time_data && (
                   <li className="flex items-center gap-2">
                     <span className="text-teal-400">✓</span> Real-Time Data
                   </li>
                 )}
              </ul>
            </div>
          ) : (
             <div className="text-zinc-500 text-sm font-medium h-[calc(100%-3rem)] flex items-center justify-center border border-zinc-800/50 border-dashed rounded-2xl relative z-10">
               No active plan found.
             </div>
          )}
        </div>
      </div>

      <h2 className="text-xl font-bold tracking-tight text-zinc-200 mb-6">Upgrade Plan</h2>
      
      {upgradePlans.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {upgradePlans.map((plan: any) => (
            <div key={plan.id} className="bg-zinc-900/60 border border-zinc-800/80 rounded-3xl p-8 shadow-2xl relative flex flex-col items-center group hover:border-teal-500/40 transition-all duration-300">
              <div className="absolute -inset-px bg-gradient-to-r from-teal-500/10 to-indigo-500/10 rounded-3xl blur opacity-20 group-hover:opacity-40 transition-all duration-300 pointer-events-none" />
              <span className="text-zinc-300 text-sm font-black uppercase tracking-widest text-center h-8 flex items-center justify-center relative z-10">
                {plan.displayname || plan.name}
              </span>
              <div className="mt-2 flex items-baseline gap-1 relative z-10">
                <span className="text-4xl font-black text-zinc-100">
                  {plan.currency === 'INR' ? '₹' : '$'}
                  {plan.upgrade_payable_amount !== undefined 
                    ? Number(plan.upgrade_payable_amount).toFixed(0) 
                    : Number(plan.price).toFixed(0)}
                </span>
                <span className="text-zinc-500 text-xs font-bold whitespace-nowrap">
                  {getDurationSuffix(plan.duration_days)} <span className="text-[10px] ml-0.5">+ {Number(plan.gst_percentage).toFixed(0)}% GST</span>
                </span>
              </div>
              
              {plan.upgrade_payable_amount !== undefined && (
                <div className="text-[10px] text-teal-400 font-bold bg-teal-500/10 border border-teal-500/20 px-2 py-1 rounded mt-2 uppercase tracking-wide relative z-10">
                  Pro-rated Price Applied
                </div>
              )}

              <div className="w-full border-t border-zinc-800/60 my-6 relative z-10" />

              <ul className="w-full text-left space-y-3 mb-8 text-xs font-bold text-zinc-400 flex-1 relative z-10">
                {plan.description ? plan.description.split('\n').filter((line: string) => line.trim() !== "").map((line: string, i: number) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-teal-400 mt-0.5">✓</span> <span className="leading-relaxed">{line.trim()}</span>
                  </li>
                )) : (
                  <>
                    <li className="flex items-center gap-2">
                      <span className="text-teal-400">✓</span> {plan.max_portfolios} Max Portfolios
                    </li>
                    <li className="flex items-center gap-2">
                      <span className={plan.real_time_data ? "text-teal-400" : "text-zinc-600"}>✓</span> Real-Time Data
                    </li>
                    <li className="flex items-center gap-2">
                      <span className={plan.advanced_analytics ? "text-teal-400" : "text-zinc-600"}>✓</span> Advanced Analytics
                    </li>
                  </>
                )}
              </ul>

              <Link 
                href={`/payment/summary?id=${plan.id}`} 
                className="w-full mt-auto text-center py-3 bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-400 hover:to-teal-500 text-zinc-950 font-extrabold text-sm uppercase tracking-wider rounded-xl shadow-lg transform active:scale-98 transition-all duration-200 relative z-10"
              >
                Upgrade Now
              </Link>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-zinc-500 text-sm font-medium py-12 flex items-center justify-center border border-zinc-800/50 border-dashed rounded-2xl bg-zinc-900/10">
          No upgrade plans available at this moment.
        </div>
      )}
    </div>
  );
}
