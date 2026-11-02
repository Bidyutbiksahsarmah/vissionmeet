"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await api.login(email, password);
      router.push("/meetings");
    } catch (err: any) {
      setError(err.message || "Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-surface-light dark:bg-surface-dark">
      <div className="w-full max-w-sm bg-white dark:bg-[#171D25] border border-border-light dark:border-border-dark rounded p-8">
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-4 h-4 rounded-full border-2 border-primary dark:border-blue-400"></div>
            <span className="font-semibold text-lg text-primary dark:text-slateText-dark">
              VisionMeet
            </span>
          </div>
          <h1 className="text-xl font-semibold text-slateText-light dark:text-slateText-dark">
            Sign in to your workspace
          </h1>
          <p className="text-xs text-slateText-lightSec dark:text-slateText-darkSec mt-1">
            Access meeting notes, extracted tasks, and follow-ups.
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slateText-light dark:text-slateText-dark mb-1">
              Email address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="alex@company.com"
              className="w-full px-3 py-2 text-xs border border-border-light dark:border-border-dark rounded bg-white dark:bg-[#0F1419] text-slateText-light dark:text-slateText-dark focus:outline-none focus:border-accent"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slateText-light dark:text-slateText-dark mb-1">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3 py-2 text-xs border border-border-light dark:border-border-dark rounded bg-white dark:bg-[#0F1419] text-slateText-light dark:text-slateText-dark focus:outline-none focus:border-accent"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 px-4 bg-primary hover:bg-primary-hover text-white text-xs font-medium rounded transition-colors disabled:opacity-50"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <p className="text-xs text-center text-slateText-lightSec dark:text-slateText-darkSec mt-6">
          Do not have an account?{" "}
          <Link href="/register" className="text-accent hover:underline font-medium">
            Create account
          </Link>
        </p>
      </div>
    </div>
  );
}
