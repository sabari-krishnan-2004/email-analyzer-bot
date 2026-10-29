"use client";

import React from "react";
import {
  ExternalLink,
  Sparkles,
  AlertCircle,
  Clock,
  CheckCircle2,
  Tag,
} from "lucide-react";
import { EmailCategory, EmailPriority, EmailRecord } from "@/types";

interface EmailCardProps {
  email: EmailRecord;
}

export const EmailCard: React.FC<EmailCardProps> = ({ email }) => {
  // Format received date
  const formatReceivedDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

      if (diffMins < 60) {
        return `${Math.max(1, diffMins)}m ago`;
      }
      if (diffHours < 24) {
        return `${diffHours}h ago`;
      }
      return date.toLocaleDateString([], {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateStr;
    }
  };

  // Sender initial & clean name
  const senderName = email.sender.split("<")[0].trim().replace(/['"]/g, "");
  const senderInitial = senderName.charAt(0).toUpperCase() || "E";
  const gmailLink = `https://mail.google.com/mail/u/0/#inbox/${email.gmail_message_id}`;

  // Priority Styles
  const getPriorityBadge = (priority: EmailPriority) => {
    switch (priority) {
      case "High":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/40 badge-glow-red">
            <span className="h-1.5 w-1.5 rounded-full bg-rose-400 animate-ping" />
            High Priority
          </span>
        );
      case "Medium":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-500/20 text-amber-300 border border-amber-500/30">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
            Medium
          </span>
        );
      case "Low":
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-normal bg-slate-800 text-slate-400 border border-slate-700">
            Low
          </span>
        );
    }
  };

  // Category Styles
  const getCategoryPill = (category: EmailCategory) => {
    switch (category) {
      case "Important":
        return "bg-rose-500/10 text-rose-300 border-rose-500/30";
      case "Work":
        return "bg-indigo-500/10 text-indigo-300 border-indigo-500/30";
      case "Transactions":
        return "bg-emerald-500/10 text-emerald-300 border-emerald-500/30";
      case "Promotions":
        return "bg-purple-500/10 text-purple-300 border-purple-500/30";
      case "Updates":
      default:
        return "bg-sky-500/10 text-sky-300 border-sky-500/30";
    }
  };

  return (
    <article className="glass-card rounded-xl p-5 relative transition-all duration-200">
      {/* Top Meta Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        {/* Sender details */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-slate-700 to-slate-800 text-slate-200 font-bold text-sm border border-slate-700 shadow-inner">
            {senderInitial}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm text-slate-100 truncate">
                {senderName}
              </span>
            </div>
            <p className="text-xs text-slate-400 truncate max-w-xs sm:max-w-md">
              {email.sender}
            </p>
          </div>
        </div>

        {/* Priority & Badges */}
        <div className="flex items-center gap-2 flex-wrap">
          {email.action_required && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/40">
              <AlertCircle className="h-3 w-3 text-amber-400" />
              Action Required
            </span>
          )}

          {/* Category Pill */}
          <span
            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${getCategoryPill(
              email.category
            )}`}
          >
            <Tag className="h-3 w-3" />
            {email.category}
          </span>

          {/* Priority Badge */}
          {getPriorityBadge(email.priority)}

          {/* Received Time */}
          <span className="text-xs text-slate-400 flex items-center gap-1 ml-1">
            <Clock className="h-3 w-3 text-slate-500" />
            {formatReceivedDate(email.received_at)}
          </span>
        </div>
      </div>

      {/* Email Subject */}
      <h3 className="text-base font-semibold text-slate-100 mb-3 leading-snug">
        {email.subject}
      </h3>

      {/* AI Summary Box */}
      <div className="rounded-lg bg-indigo-950/25 border border-indigo-500/20 p-3.5 mb-4 relative overflow-hidden">
        <div className="flex items-start gap-2.5">
          <div className="p-1 rounded bg-indigo-500/20 text-indigo-400 shrink-0 mt-0.5">
            <Sparkles className="h-3.5 w-3.5" />
          </div>
          <div className="text-xs sm:text-sm text-slate-200 leading-relaxed">
            <span className="font-semibold text-indigo-300 mr-1.5">AI Summary:</span>
            {email.summary}
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-800/60 text-xs">
        <div className="text-slate-500 flex items-center gap-1">
          <span className="text-[11px] font-mono">ID: {email.gmail_message_id.substring(0, 10)}...</span>
        </div>

        <a
          href={gmailLink}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-indigo-600/20 text-slate-300 hover:text-indigo-300 border border-slate-700/80 hover:border-indigo-500/40 transition-all font-medium cursor-pointer"
        >
          <span>Open in Gmail</span>
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
      </div>
    </article>
  );
};
