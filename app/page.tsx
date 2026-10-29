"use client";

import React, { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Sparkles,
  Mail,
  ShieldCheck,
  Zap,
  ArrowRight,
  Lock,
  Layers,
  Clock,
  CheckCircle,
  AlertCircle,
} from "lucide-react";

function HomeContent() {
  const searchParams = useSearchParams();
  const errorParam = searchParams.get("error");

  return (
    <div className="min-h-screen flex flex-col justify-between">
      {/* Top Header */}
      <header className="border-b border-slate-800/80 bg-[#090d16]/70 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-500 shadow-lg shadow-indigo-500/20">
              <Mail className="h-5 w-5 text-white" />
              <Sparkles className="absolute -top-1 -right-1 h-3.5 w-3.5 text-amber-300 animate-pulse" />
            </div>
            <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
              AuraMail AI
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="text-xs sm:text-sm text-slate-300 hover:text-white px-3 py-1.5 rounded-lg border border-slate-800 hover:border-slate-700 transition-all"
            >
              Live Demo
            </Link>
            <a
              href="/api/auth/google"
              className="flex items-center gap-2 rounded-lg bg-indigo-600 px-3.5 py-1.5 text-xs sm:text-sm font-medium text-white shadow-md shadow-indigo-600/25 hover:bg-indigo-500 transition-all cursor-pointer"
            >
              <span>Connect Gmail</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 flex flex-col items-center text-center">
        {/* Error Alert if redirected from OAuth failure */}
        {errorParam && (
          <div className="mb-8 p-4 max-w-xl w-full rounded-xl bg-rose-950/50 border border-rose-500/40 text-rose-300 text-xs sm:text-sm flex items-start gap-3 text-left">
            <AlertCircle className="h-5 w-5 shrink-0 text-rose-400 mt-0.5" />
            <div>
              <div className="font-semibold mb-1">Authentication Notice</div>
              <div>{decodeURIComponent(errorParam)}</div>
            </div>
          </div>
        )}

        {/* Hero Pill */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-medium mb-6">
          <Sparkles className="h-3.5 w-3.5 text-amber-400" />
          <span>Powered by Gemini 1.5 Flash & Supabase</span>
        </div>

        {/* Hero Heading */}
        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight max-w-4xl leading-[1.15] mb-6">
          Zero Inbox Overload.{" "}
          <span className="bg-gradient-to-r from-indigo-400 via-purple-300 to-pink-400 bg-clip-text text-transparent">
            AI Email Triage
          </span>{" "}
          for High-Velocity Teams.
        </h1>

        {/* Hero Description */}
        <p className="text-base sm:text-lg text-slate-400 max-w-2xl mb-10 leading-relaxed">
          Connect your Google account with read-only permissions. AuraMail runs
          morning automated cron syncs or on-demand manual triggers to ingest,
          classify, and summarize unread emails into executive action cards.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-4 mb-16">
          <a
            href="/api/auth/google"
            className="flex items-center gap-3 px-6 py-3.5 rounded-xl bg-white text-slate-900 font-semibold text-sm shadow-xl shadow-white/10 hover:bg-slate-100 active:scale-98 transition-all cursor-pointer group"
          >
            {/* Google Icon */}
            <svg className="h-4 w-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Sign in with Google</span>
            <ArrowRight className="h-4 w-4 text-slate-600 group-hover:translate-x-0.5 transition-transform" />
          </a>

          <Link
            href="/dashboard"
            className="flex items-center gap-2 px-6 py-3.5 rounded-xl border border-slate-800 bg-slate-900/60 text-slate-200 font-medium text-sm hover:bg-slate-800/80 transition-all cursor-pointer"
          >
            <span>Explore Live Dashboard Demo</span>
          </Link>
        </div>

        {/* Feature Highlights Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl w-full text-left">
          {/* Feature 1 */}
          <div className="glass-card rounded-2xl p-6 border border-slate-800/80 relative overflow-hidden">
            <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 w-fit mb-4">
              <Sparkles className="h-5 w-5" />
            </div>
            <h3 className="font-semibold text-slate-100 text-base mb-2">
              Gemini Flash AI Categorizer
            </h3>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              Emails are automatically grouped into 5 distinct categories:
              Important, Work, Transactions, Promotions, and Updates with
              1-2 sentence executive action summaries.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="glass-card rounded-2xl p-6 border border-slate-800/80 relative overflow-hidden">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 w-fit mb-4">
              <Clock className="h-5 w-5" />
            </div>
            <h3 className="font-semibold text-slate-100 text-base mb-2">
              Automated Daily Cron Sync
            </h3>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              Configured via Vercel Cron to trigger every morning, fetching only
              unread emails from the past 24 hours while filtering existing
              database records to save LLM tokens.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="glass-card rounded-2xl p-6 border border-slate-800/80 relative overflow-hidden">
            <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400 w-fit mb-4">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <h3 className="font-semibold text-slate-100 text-base mb-2">
              AES-256-GCM Token Encryption
            </h3>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              OAuth refresh tokens are encrypted at rest using industry-standard
              authenticated symmetric encryption, ensuring sensitive Google credentials
              are never stored in plaintext.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 py-6 text-center text-xs text-slate-500">
        <p>Built with Next.js 14, Supabase, Google Generative AI, and Tailwind CSS.</p>
      </footer>
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#090d16]" />}>
      <HomeContent />
    </Suspense>
  );
}
