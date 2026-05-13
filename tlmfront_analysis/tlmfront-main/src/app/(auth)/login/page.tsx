"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import tlmApis from "@/api/tlmapis";
import { useAuthStore } from "@/store/authStore";
import { Turnstile } from '@marsidev/react-turnstile';

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState("");
  const router = useRouter();
  const { setAuth, accessToken } = useAuthStore();
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || "0x4AAAAAADKwgCUOGBWq2OAD";

  useEffect(() => {
    if (accessToken) {
      router.replace("/home");
    }
  }, [accessToken, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      if (!turnstileToken) {
        setError("Please complete the security check.");
        setIsLoading(false);
        return;
      }

      const response = await tlmApis.login({
        email,
        password,
        turnstile_token: turnstileToken,
      });

      if (response.data?.access) {
        setAuth(response.data.access, response.data.user);
        localStorage.removeItem('tlm_selected_date_v2');
        router.push("/home");
      }
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to login. Please check your credentials.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-xl shadow-lg border border-gray-100">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to your account
          </h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 text-red-500 p-3 rounded-md text-sm text-center border border-red-100">
              {error}
            </div>
          )}
          <div className="rounded-md shadow-sm space-y-4">
            <div>
              <label htmlFor="email-address" className="sr-only">Email address</label>
              <input
                id="email-address"
                name="email"
                type="email"
                required
                className="appearance-none rounded-lg relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 focus:z-10 sm:text-sm"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="appearance-none rounded-lg relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 focus:z-10 sm:text-sm"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="text-sm">
              <Link href="/forgot-password" className="font-medium text-emerald-600 hover:text-emerald-500">
                Forgot your password?
              </Link>
            </div>
          </div>

          <div className="flex justify-center my-4">
            <Turnstile siteKey={siteKey} options={{ theme: 'light' }} onSuccess={(token) => setTurnstileToken(token)} />
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className={`group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white ${
                isLoading ? 'bg-emerald-400' : 'bg-emerald-600 hover:bg-emerald-700'
              } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-colors`}
            >
              {isLoading ? 'Signing in...' : 'Sign in'}
            </button>
          </div>
        </form>
        
        <div className="text-center mt-4 text-sm text-gray-600">
          Don't have an account?{" "}
          <Link href="/signup" className="font-medium text-emerald-600 hover:text-emerald-500">
            Sign up
          </Link>
        </div>
      </div>
    </div>
  );
}
