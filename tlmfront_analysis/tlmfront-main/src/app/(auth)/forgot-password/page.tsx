"use client";

import { useState } from "react";
import Link from "next/link";
import { API } from "@/api/axios";
import { Turnstile } from '@marsidev/react-turnstile';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const [turnstileToken, setTurnstileToken] = useState("");
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || "0x4AAAAAADKwgCUOGBWq2OAD";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!turnstileToken) {
      setStatus("error");
      setMessage("Please complete the security check.");
      return;
    }
    setStatus("loading");

    try {
      const res = await API.post("/api/auth/forgot-password/", { 
        email,
        turnstile_token: turnstileToken
      });
      setStatus("success");
      setMessage(res.data.message || "Reset link sent to your email.");
    } catch (err: any) {
      setStatus("error");
      setMessage(err.response?.data?.error || "An error occurred. Please try again.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-xl shadow-lg border border-gray-100">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Reset Password
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Enter your email and we'll send you a link to reset your password.
          </p>
        </div>

        {status === "success" ? (
          <div className="bg-emerald-50 text-emerald-700 p-4 rounded-lg border border-emerald-200 text-center">
            {message}
          </div>
        ) : (
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            {status === "error" && (
              <div className="bg-red-50 text-red-500 p-3 rounded-md text-sm text-center border border-red-100">
                {message}
              </div>
            )}
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

            <div className="flex justify-center my-4">
              <Turnstile siteKey={siteKey} options={{ theme: 'light' }} onSuccess={(token) => setTurnstileToken(token)} />
            </div>

            <div>
              <button
                type="submit"
                disabled={status === "loading"}
                className={`group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white ${
                  status === "loading" ? 'bg-emerald-400' : 'bg-emerald-600 hover:bg-emerald-700'
                } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-colors`}
              >
                {status === "loading" ? 'Sending...' : 'Send Reset Link'}
              </button>
            </div>
          </form>
        )}
        
        <div className="text-center mt-4 text-sm text-gray-600">
          <Link href="/login" className="font-medium text-emerald-600 hover:text-emerald-500">
            Back to login
          </Link>
        </div>
      </div>
    </div>
  );
}
