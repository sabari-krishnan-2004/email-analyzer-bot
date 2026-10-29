"use client";

import React from "react";
import { Mail, AlertTriangle, CheckSquare, Sparkles, FolderKanban } from "lucide-react";
import { DashboardMetrics } from "@/types";

interface MetricsBarProps {
  metrics: DashboardMetrics;
  selectedCategory: string;
  onSelectCategory: (cat: string) => void;
}

export const MetricsBar: React.FC<MetricsBarProps> = ({
  metrics,
  selectedCategory,
  onSelectCategory,
}) => {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
      {/* 1. Total Unread */}
      <div
        onClick={() => onSelectCategory("All")}
        className={`glass-card p-4 rounded-xl cursor-pointer relative overflow-hidden group ${
          selectedCategory === "All" ? "border-indigo-500/50 bg-indigo-950/20" : ""
        }`}
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-slate-400">Total Unread (24h)</span>
          <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 group-hover:scale-110 transition-transform">
            <Mail className="h-4 w-4" />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            {metrics.total}
          </span>
          <span className="text-xs text-indigo-400 font-medium">Messages</span>
        </div>
        <div className="mt-2 flex items-center gap-1.5 text-[11px] text-slate-400">
          <Sparkles className="h-3 w-3 text-indigo-400" />
          <span>Gemini triaged</span>
        </div>
      </div>

      {/* 2. High Priority */}
      <div
        onClick={() => onSelectCategory("Important")}
        className={`glass-card p-4 rounded-xl cursor-pointer relative overflow-hidden group ${
          selectedCategory === "Important" ? "border-rose-500/50 bg-rose-950/20" : ""
        }`}
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-slate-400">High Priority</span>
          <div className="p-2 rounded-lg bg-rose-500/10 text-rose-400 group-hover:scale-110 transition-transform">
            <AlertTriangle className="h-4 w-4" />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl sm:text-3xl font-bold tracking-tight text-rose-400">
            {metrics.highPriority}
          </span>
          {metrics.highPriority > 0 && (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/30">
              Needs Attention
            </span>
          )}
        </div>
        <div className="mt-2 text-[11px] text-slate-400">
          Critical updates & urgent inquiries
        </div>
      </div>

      {/* 3. Action Required */}
      <div
        className="glass-card p-4 rounded-xl relative overflow-hidden group"
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-slate-400">Action Required</span>
          <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 group-hover:scale-110 transition-transform">
            <CheckSquare className="h-4 w-4" />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl sm:text-3xl font-bold tracking-tight text-amber-400">
            {metrics.actionRequired}
          </span>
          <span className="text-xs text-amber-400/80 font-medium">Pending tasks</span>
        </div>
        <div className="mt-2 text-[11px] text-slate-400">
          Sign-offs, invoices & approvals
        </div>
      </div>

      {/* 4. Category Diversity Breakdown */}
      <div className="glass-card p-4 rounded-xl relative overflow-hidden">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-slate-400">Category Spread</span>
          <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400">
            <FolderKanban className="h-4 w-4" />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-1.5 text-[11px] mt-1">
          <div className="bg-slate-800/60 rounded px-1.5 py-1 text-center">
            <span className="text-indigo-300 font-semibold">{metrics.categories.Work}</span>{" "}
            <span className="text-slate-400 text-[10px]">Work</span>
          </div>
          <div className="bg-slate-800/60 rounded px-1.5 py-1 text-center">
            <span className="text-emerald-300 font-semibold">{metrics.categories.Transactions}</span>{" "}
            <span className="text-slate-400 text-[10px]">Txns</span>
          </div>
          <div className="bg-slate-800/60 rounded px-1.5 py-1 text-center">
            <span className="text-purple-300 font-semibold">{metrics.categories.Promotions}</span>{" "}
            <span className="text-slate-400 text-[10px]">Promo</span>
          </div>
        </div>
        <div className="mt-2 text-[11px] text-slate-400 truncate">
          {metrics.categories.Updates} updates & social notices
        </div>
      </div>
    </div>
  );
};
