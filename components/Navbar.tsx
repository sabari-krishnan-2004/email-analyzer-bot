"use client";

import React from "react";
import Link from "next/link";
import { Sparkles, Mail, RefreshCw, LogOut, CheckCircle2 } from "lucide-react";

interface NavbarProps {
  userEmail?: string;
  lastSyncedAt?: string | null;
  onSync: () => void;
  isSyncing: boolean;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  userEmail,
  lastSyncedAt,
  onSync,
  isSyncing,
  onLogout,
}) => {
  const formatTime = (isoString?: string | null) => {
    if (!isoString) return "Never synced";
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } catch {
      return "Unknown";
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-[#090d16]/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand / Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-500 shadow-lg shadow-indigo-500/20 group-hover:shadow-indigo-500/40 transition-all duration-300">
            <Mail className="h-5 w-5 text-white" />
            <Sparkles className="absolute -top-1 -right-1 h-3.5 w-3.5 text-amber-300 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
                AuraMail
              </span>
              <span className="text-[10px] font-semibold tracking-wider uppercase px-1.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                AI Flash
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              Intelligent Inbox Triage
            </p>
          </div>
        </Link>

        {/* Action Controls */}
        <div className="flex items-center gap-3">
          {userEmail && (
            <div className="hidden md:flex flex-col items-end text-xs">
              <span className="font-medium text-slate-300 truncate max-w-[200px]">
                {userEmail}
              </span>
              <span className="text-[11px] text-slate-500 flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3 text-emerald-400 inline" />
                Synced: {formatTime(lastSyncedAt)}
              </span>
            </div>
          )}

          {/* Sync Button */}
          <button
            onClick={onSync}
            disabled={isSyncing}
            className="flex items-center gap-2 rounded-lg bg-indigo-600 px-3.5 py-2 text-xs sm:text-sm font-medium text-white shadow-md shadow-indigo-600/25 hover:bg-indigo-500 active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
            title="Fetch new unread emails and classify with Gemini"
          >
            <RefreshCw
              className={`h-4 w-4 ${isSyncing ? "animate-spin text-white" : ""}`}
            />
            <span>{isSyncing ? "Syncing Inbox..." : "Sync Now"}</span>
          </button>

          {/* Logout Button */}
          <button
            onClick={onLogout}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-700/80 bg-slate-800/50 text-slate-400 hover:text-white hover:bg-slate-700/60 transition-all cursor-pointer"
            title="Log out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
