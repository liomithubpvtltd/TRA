"use client";

import PlanSummary from "@/components/payment/PlanSummary";

export default function PaymentSummaryPage() {
  return (
    <div className="w-full min-h-screen bg-zinc-950 text-zinc-100 flex items-center justify-center relative overflow-hidden">
        {/* Background Effects */}
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-teal-500/5 blur-[120px] rounded-full" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-500/5 blur-[120px] rounded-full" />
        </div>

        <div className="w-full relative z-10 py-10">
            <PlanSummary />
        </div>
    </div>
  );
}
