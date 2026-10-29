"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { MetricsBar } from "@/components/MetricsBar";
import { CategoryTabs } from "@/components/CategoryTabs";
import { EmailCard } from "@/components/EmailCard";
import { EmailRecord, DashboardMetrics } from "@/types";
import {
  Inbox,
  AlertCircle,
  Sparkles,
  CheckCircle,
  HelpCircle,
  Layers,
} from "lucide-react";

export default function DashboardPage() {
  const router = useRouter();

  // State
  const [user, setUser] = useState<{
    id: string;
    email: string;
    lastSyncedAt: string | null;
  } | null>(null);

  const [emails, setEmails] = useState<EmailRecord[]>([]);
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    total: 0,
    highPriority: 0,
    actionRequired: 0,
    categories: {
      Important: 0,
      Work: 0,
      Transactions: 0,
      Promotions: 0,
      Updates: 0,
    },
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatusMessage, setSyncStatusMessage] = useState<{
    type: "success" | "error" | "info";
    text: string;
  } | null>(null);

  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedPriority, setSelectedPriority] = useState("All");
  const [actionRequiredOnly, setActionRequiredOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDemoData, setIsDemoData] = useState(false);

  // Load user
  const fetchUser = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me");
      if (res.ok) {
        const data = await res.json();
        if (data.authenticated) {
          setUser(data.user);
          return data.user;
        }
      }
      // If unauthorized, could be exploring demo mode
      setUser({
        id: "demo-user",
        email: "demo-executive@company.io",
        lastSyncedAt: new Date().toISOString(),
      });
      return null;
    } catch {
      return null;
    }
  }, []);

  // Fetch emails with active filters
  const fetchEmails = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedCategory !== "All") params.append("category", selectedCategory);
      if (selectedPriority !== "All") params.append("priority", selectedPriority);
      if (actionRequiredOnly) params.append("actionRequired", "true");
      if (searchQuery.trim()) params.append("q", searchQuery.trim());
      params.append("demo", "true"); // Allow fallback if session cookie isn't ready

      const res = await fetch(`/api/emails?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setEmails(data.emails || []);
        if (data.metrics) {
          setMetrics(data.metrics);
        }
        setIsDemoData(Boolean(data.isUsingDemoFallback));
      }
    } catch (err) {
      console.error("Failed to load emails:", err);
    } finally {
      setIsLoading(false);
    }
  }, [selectedCategory, selectedPriority, actionRequiredOnly, searchQuery]);

  // Initial mount
  useEffect(() => {
    fetchUser();
    fetchEmails();
  }, [fetchUser, fetchEmails]);

  // Sync Now action
  const handleSync = async () => {
    setIsSyncing(true);
    setSyncStatusMessage({
      type: "info",
      text: "Connecting to Gmail API & classifying unread messages with Gemini Flash...",
    });

    try {
      const res = await fetch("/api/cron/sync-emails", {
        method: "POST",
      });

      const data = await res.json();

      if (res.ok && data.success) {
        const count =
          data.result?.newEmailsClassified ??
          data.newEmailsClassified ??
          (data.simulated ? 8 : 0);

        setSyncStatusMessage({
          type: "success",
          text: `Sync complete! Successfully triaged and categorized ${count} new emails.`,
        });

        // Refresh user and emails
        await fetchUser();
        await fetchEmails();
      } else {
        setSyncStatusMessage({
          type: "error",
          text: data.error || data.details || "Sync failed. Check API credentials.",
        });
      }
    } catch (err: any) {
      setSyncStatusMessage({
        type: "error",
        text: err?.message || "Network error while syncing emails.",
      });
    } finally {
      setIsSyncing(false);
      // Auto-hide success message after 7 seconds
      setTimeout(() => {
        setSyncStatusMessage((prev) => (prev?.type === "success" ? null : prev));
      }, 7000);
    }
  };

  // Logout action
  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {}
    router.push("/");
  };

  const handleResetFilters = () => {
    setSelectedCategory("All");
    setSelectedPriority("All");
    setActionRequiredOnly(false);
    setSearchQuery("");
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top Navbar */}
      <Navbar
        userEmail={user?.email}
        lastSyncedAt={user?.lastSyncedAt}
        onSync={handleSync}
        isSyncing={isSyncing}
        onLogout={handleLogout}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Sync Status Banner */}
        {syncStatusMessage && (
          <div
            className={`mb-6 p-4 rounded-xl flex items-center justify-between gap-3 text-sm border animate-in fade-in slide-in-from-top-2 duration-300 ${
              syncStatusMessage.type === "success"
                ? "bg-emerald-950/40 border-emerald-500/40 text-emerald-300"
                : syncStatusMessage.type === "error"
                ? "bg-rose-950/40 border-rose-500/40 text-rose-300"
                : "bg-indigo-950/40 border-indigo-500/40 text-indigo-300"
            }`}
          >
            <div className="flex items-center gap-2.5">
              {syncStatusMessage.type === "success" ? (
                <CheckCircle className="h-5 w-5 shrink-0 text-emerald-400" />
              ) : syncStatusMessage.type === "error" ? (
                <AlertCircle className="h-5 w-5 shrink-0 text-rose-400" />
              ) : (
                <Sparkles className="h-5 w-5 shrink-0 text-indigo-400 animate-spin" />
              )}
              <span>{syncStatusMessage.text}</span>
            </div>
            <button
              onClick={() => setSyncStatusMessage(null)}
              className="text-xs opacity-75 hover:opacity-100 underline cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Demo Mode Notice Banner */}
        {isDemoData && (
          <div className="mb-6 p-3.5 rounded-xl bg-indigo-950/30 border border-indigo-500/20 flex flex-wrap items-center justify-between gap-3 text-xs text-indigo-300">
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-indigo-400 animate-ping" />
              <span className="font-medium">
                Live Preview Mode Active: Demonstrating AI email triage with representative executive emails.
              </span>
            </div>
            <div className="text-slate-400 text-[11px]">
              Connect your Google OAuth & Supabase credentials in <code className="text-indigo-300 bg-slate-900 px-1.5 py-0.5 rounded">.env.local</code> for direct personal inbox sync.
            </div>
          </div>
        )}

        {/* Top Metrics Cards */}
        <MetricsBar
          metrics={metrics}
          selectedCategory={selectedCategory}
          onSelectCategory={(cat) => setSelectedCategory(cat)}
        />

        {/* Category Tabs, Search & Filters */}
        <CategoryTabs
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
          selectedPriority={selectedPriority}
          onSelectPriority={setSelectedPriority}
          actionRequiredOnly={actionRequiredOnly}
          onToggleActionRequired={() => setActionRequiredOnly((prev) => !prev)}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          metrics={metrics}
          onResetFilters={handleResetFilters}
        />

        {/* Email Cards Stream */}
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4].map((n) => (
              <div
                key={n}
                className="glass-card rounded-xl p-5 animate-pulse space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 bg-slate-800 rounded-lg" />
                    <div className="space-y-1.5">
                      <div className="h-4 w-32 bg-slate-800 rounded" />
                      <div className="h-3 w-48 bg-slate-800/60 rounded" />
                    </div>
                  </div>
                  <div className="h-6 w-24 bg-slate-800 rounded-full" />
                </div>
                <div className="h-5 w-3/4 bg-slate-800 rounded mt-2" />
                <div className="h-16 w-full bg-slate-800/40 rounded-lg" />
              </div>
            ))}
          </div>
        ) : emails.length === 0 ? (
          <div className="glass-card rounded-2xl p-12 text-center max-w-md mx-auto my-12 border border-slate-800">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-400 mb-4 border border-indigo-500/20">
              <Inbox className="h-7 w-7" />
            </div>
            <h3 className="text-lg font-semibold text-slate-100 mb-1">
              No matching emails found
            </h3>
            <p className="text-sm text-slate-400 mb-6">
              There are no emails matching your selected category, priority, or search query.
            </p>
            <button
              onClick={handleResetFilters}
              className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-xs font-medium hover:bg-indigo-500 transition-all cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs text-slate-400 px-1">
              <span>Showing {emails.length} of {metrics.total} emails</span>
              <span className="flex items-center gap-1 text-[11px] text-slate-500">
                <Layers className="h-3 w-3" /> Sorted by newest received
              </span>
            </div>
            {emails.map((email) => (
              <EmailCard key={email.id} email={email} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
