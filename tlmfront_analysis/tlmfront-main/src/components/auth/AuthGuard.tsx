"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { API } from "@/api/axios";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { accessToken, setAuth, clearAuth } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);
  const pathname = usePathname();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await API.post("/api/auth/refresh/");
        if (response.data?.access) {
          setAuth(response.data.access, response.data.user);
          setIsLoading(false);
        } else {
          throw new Error("Not authenticated");
        }
      } catch (error) {
        clearAuth();
        router.replace("/login");
      }
    };

    if (!accessToken) {
      checkAuth();
    } else {
      setIsLoading(false);
    }
  }, [accessToken, router, setAuth, clearAuth]);

  useEffect(() => {
    // Redirection logic for subscriptions
    if (!isLoading && accessToken && useAuthStore.getState().user) {
      const user = useAuthStore.getState().user;
      
      // Paths accessible without an active subscription
      const allowedPaths = ["/plans", "/payment/summary", "/email-verification", "/verify-email"];
      const isPathAllowed = allowedPaths.some(path => pathname?.includes(path));
      
      // 1. Check Email Verification First
      if (!user?.is_email_verified && !pathname?.includes("/email-verification") && !pathname?.includes("/verify-email")) {
        router.replace("/email-verification");
        return;
      }

      // 2. Then Check Subscription
      if (user?.is_email_verified && !user?.has_active_subscription && !isPathAllowed) {
        router.replace("/plans");
      }
    }
  }, [isLoading, accessToken, router, pathname]);

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-white flex items-center justify-center z-50">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
          <p className="mt-4 text-gray-500 font-medium text-sm">Checking authentication...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
