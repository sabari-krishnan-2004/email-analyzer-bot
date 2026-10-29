"use client";

import React from "react";
import { Search, Filter, CheckCircle2, X } from "lucide-react";
import { EmailCategory, EmailPriority, DashboardMetrics } from "@/types";

interface CategoryTabsProps {
  selectedCategory: string;
  onSelectCategory: (cat: string) => void;
  selectedPriority: string;
  onSelectPriority: (p: string) => void;
  actionRequiredOnly: boolean;
  onToggleActionRequired: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  metrics: DashboardMetrics;
  onResetFilters: () => void;
}

const CATEGORIES: { label: string; value: string; countKey?: EmailCategory }[] = [
  { label: "All Emails", value: "All" },
  { label: "Important", value: "Important", countKey: "Important" },
  { label: "Work", value: "Work", countKey: "Work" },
  { label: "Transactions", value: "Transactions", countKey: "Transactions" },
  { label: "Promotions", value: "Promotions", countKey: "Promotions" },
  { label: "Updates", value: "Updates", countKey: "Updates" },
];

export const CategoryTabs: React.FC<CategoryTabsProps> = ({
  selectedCategory,
  onSelectCategory,
  selectedPriority,
  onSelectPriority,
  actionRequiredOnly,
  onToggleActionRequired,
  searchQuery,
  onSearchChange,
  metrics,
  onResetFilters,
}) => {
  const isFiltered =
    selectedCategory !== "All" ||
    selectedPriority !== "All" ||
    actionRequiredOnly ||
    searchQuery.length > 0;

  return (
    <div className="space-y-4 mb-6">
      {/* Category Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none border-b border-slate-800/80">
        {CATEGORIES.map((cat) => {
          const isSelected = selectedCategory === cat.value;
          const count =
            cat.value === "All"
              ? metrics.total
              : cat.countKey
              ? metrics.categories[cat.countKey] || 0
              : 0;

          return (
            <button
              key={cat.value}
              onClick={() => onSelectCategory(cat.value)}
              className={`flex items-center gap-2 px-3.5 py-2.5 text-xs sm:text-sm font-medium whitespace-nowrap border-b-2 transition-all cursor-pointer ${
                isSelected
                  ? "border-indigo-500 text-white font-semibold"
                  : "border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700"
              }`}
            >
              <span>{cat.label}</span>
              <span
                className={`text-[11px] px-1.5 py-0.2 rounded-full font-mono ${
                  isSelected
                    ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30"
                    : "bg-slate-800 text-slate-500"
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Secondary Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search sender, subject, or AI summary..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full rounded-lg border border-slate-800 bg-slate-900/70 pl-9 pr-8 py-2 text-xs sm:text-sm text-slate-200 placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 cursor-pointer"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Priority & Action Filters */}
        <div className="flex items-center flex-wrap gap-2">
          {/* Priority selector */}
          <div className="flex items-center gap-1 bg-slate-900/80 border border-slate-800 rounded-lg p-1 text-xs">
            <span className="text-slate-500 pl-1.5 pr-1 flex items-center gap-1">
              <Filter className="h-3 w-3" /> Priority:
            </span>
            {(["All", "High", "Medium", "Low"] as const).map((p) => (
              <button
                key={p}
                onClick={() => onSelectPriority(p)}
                className={`px-2 py-1 rounded text-xs transition-all cursor-pointer ${
                  selectedPriority === p
                    ? p === "High"
                      ? "bg-rose-500/20 text-rose-300 border border-rose-500/30 font-medium"
                      : p === "Medium"
                      ? "bg-amber-500/20 text-amber-300 border border-amber-500/30 font-medium"
                      : "bg-indigo-600 text-white font-medium"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {p}
              </button>
            ))}
          </div>

          {/* Action Required Toggle */}
          <button
            onClick={onToggleActionRequired}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
              actionRequiredOnly
                ? "bg-amber-500/20 border-amber-500/40 text-amber-300 shadow-sm shadow-amber-500/10"
                : "border-slate-800 bg-slate-900/60 text-slate-400 hover:text-slate-200"
            }`}
          >
            <CheckCircle2
              className={`h-3.5 w-3.5 ${
                actionRequiredOnly ? "text-amber-400" : "text-slate-500"
              }`}
            />
            <span>Action Required</span>
          </button>

          {/* Reset Filters */}
          {isFiltered && (
            <button
              onClick={onResetFilters}
              className="px-2.5 py-1.5 text-xs text-slate-400 hover:text-slate-200 hover:underline flex items-center gap-1 cursor-pointer"
            >
              Reset
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
