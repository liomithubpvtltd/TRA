"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function DashboardRootRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/home");
  }, [router]);

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center text-zinc-400">
      <div className="animate-spin h-6 w-6 border-2 border-teal-400 border-t-transparent rounded-full mr-3" />
      <span>Routing dashboard requests...</span>
    </div>
  );
}
