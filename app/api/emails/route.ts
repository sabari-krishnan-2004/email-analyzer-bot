import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase";
import { EmailCategory, EmailPriority, EmailRecord } from "@/types";

export const dynamic = "force-dynamic";

// High-fidelity initial demo dataset for immediate preview or when database has not yet synced
const DEMO_EMAILS: EmailRecord[] = [
  {
    id: "demo-1",
    user_id: "demo-user",
    gmail_message_id: "18b9c1d2e3f4a001",
    sender: "Sarah Lin <sarah.lin@enterprise-client.com>",
    subject: "URGENT: Q4 Contract Renewal & SLA Terms Signoff Needed",
    received_at: new Date(Date.now() - 1000 * 60 * 25).toISOString(), // 25 mins ago
    category: "Important",
    priority: "High",
    summary:
      "Enterprise client requests immediate legal review and CEO sign-off on updated Q4 SLA renewal terms before 5 PM today.",
    action_required: true,
    is_read: false,
    created_at: new Date().toISOString(),
  },
  {
    id: "demo-2",
    user_id: "demo-user",
    gmail_message_id: "18b9c1d2e3f4a002",
    sender: "DevOps Automated Alerts <alerts@infrastructure.internal>",
    subject: "[P1 INCIDENT] Database connection pool spike in us-east-1",
    received_at: new Date(Date.now() - 1000 * 60 * 65).toISOString(), // 1h ago
    category: "Important",
    priority: "High",
    summary:
      "Critical alert triggered as connection pool reached 96% saturation in primary DB cluster; incident bridge opened.",
    action_required: true,
    is_read: false,
    created_at: new Date().toISOString(),
  },
  {
    id: "demo-3",
    user_id: "demo-user",
    gmail_message_id: "18b9c1d2e3f4a003",
    sender: "Alex Thorne <alex.thorne@company.internal>",
    subject: "Sprint 42 Retrospective Notes & Roadmap RFC",
    received_at: new Date(Date.now() - 1000 * 60 * 140).toISOString(), // 2h ago
    category: "Work",
    priority: "Medium",
    summary:
      "Summary of team retrospective decisions and an RFC document for next sprint's architecture milestones.",
    action_required: false,
    is_read: false,
    created_at: new Date().toISOString(),
  },
  {
    id: "demo-4",
    user_id: "demo-user",
    gmail_message_id: "18b9c1d2e3f4a004",
    sender: "Stripe Billing <invoices@stripe.com>",
    subject: "Invoice #INV-2026-8819 for Cloud Compute Services ($1,420.00)",
    received_at: new Date(Date.now() - 1000 * 60 * 240).toISOString(), // 4h ago
    category: "Transactions",
    priority: "Medium",
    summary:
      "Monthly cloud hosting invoice for $1,420.00 successfully processed and charged to Corporate Visa card ending in 4092.",
    action_required: false,
    is_read: false,
    created_at: new Date().toISOString(),
  },
  {
    id: "demo-5",
    user_id: "demo-user",
    gmail_message_id: "18b9c1d2e3f4a005",
    sender: "GitHub Notifications <notifications@github.com>",
    subject: "[PR Review Request] feat(auth): implement WebAuthn and passkeys (#418)",
    received_at: new Date(Date.now() - 1000 * 60 * 320).toISOString(), // 5h ago
    category: "Work",
    priority: "High",
    summary:
      "Marcus tagged you to review biometric auth changes touching middleware and cookie encryption logic before merge.",
    action_required: true,
    is_read: false,
    created_at: new Date().toISOString(),
  },
  {
    id: "demo-6",
    user_id: "demo-user",
    gmail_message_id: "18b9c1d2e3f4a006",
    sender: "Supabase Platform <newsletter@supabase.io>",
    subject: "Launch Week Preview: Native Vector Indexing & Edge Caching",
    received_at: new Date(Date.now() - 1000 * 60 * 480).toISOString(), // 8h ago
    category: "Updates",
    priority: "Low",
    summary:
      "Announcement of upcoming platform release featuring pgvector enhancements, upgraded CLI commands, and CDN edge caching.",
    action_required: false,
    is_read: false,
    created_at: new Date().toISOString(),
  },
  {
    id: "demo-7",
    user_id: "demo-user",
    gmail_message_id: "18b9c1d2e3f4a007",
    sender: "Figma Team <promotions@figma.com>",
    subject: "Exclusive: 20% off Figma Enterprise seat expansion through Friday",
    received_at: new Date(Date.now() - 1000 * 60 * 700).toISOString(), // 11h ago
    category: "Promotions",
    priority: "Low",
    summary:
      "Limited-time promotional discount offering 20% off additional design system collaboration seats.",
    action_required: false,
    is_read: false,
    created_at: new Date().toISOString(),
  },
  {
    id: "demo-8",
    user_id: "demo-user",
    gmail_message_id: "18b9c1d2e3f4a008",
    sender: "Google Cloud Platform <gcp-noreply@google.com>",
    subject: "Security Notification: New OAuth App Authorized on Workspace",
    received_at: new Date(Date.now() - 1000 * 60 * 820).toISOString(), // 13h ago
    category: "Important",
    priority: "High",
    summary:
      "Google Workspace security notification confirming an authorized API integration granted access to Gmail scopes.",
    action_required: false,
    is_read: false,
    created_at: new Date().toISOString(),
  },
];

export async function GET(request: NextRequest) {
  const session = await getSession();

  // If not logged in, we check if demo query is requested
  const { searchParams } = new URL(request.url);
  const isDemoRequest = searchParams.get("demo") === "true";

  if (!session && !isDemoRequest) {
    return NextResponse.json(
      { error: "Unauthorized: Please log in." },
      { status: 401 }
    );
  }

  let emails: EmailRecord[] = [];

  // Query Supabase if configured and session exists
  if (session && isSupabaseConfigured()) {
    try {
      const supabase = getSupabaseAdmin();
      const { data, error } = await supabase
        .from("emails")
        .select("*")
        .eq("user_id", session.userId)
        .order("received_at", { ascending: false });

      if (error) {
        console.error("Error querying Supabase emails:", error);
      } else if (data && data.length > 0) {
        emails = data as EmailRecord[];
      }
    } catch (err) {
      console.error("Supabase query exception:", err);
    }
  }

  // If no DB emails found yet, populate with rich demo set for instant exploration
  if (emails.length === 0) {
    emails = DEMO_EMAILS;
  }

  // Filter params
  const categoryFilter = searchParams.get("category");
  const priorityFilter = searchParams.get("priority");
  const actionFilter = searchParams.get("actionRequired");
  const searchQuery = searchParams.get("q")?.toLowerCase().trim();

  let filtered = [...emails];

  // Category filter
  if (categoryFilter && categoryFilter !== "All") {
    filtered = filtered.filter(
      (e) => e.category.toLowerCase() === categoryFilter.toLowerCase()
    );
  }

  // Priority filter
  if (priorityFilter && priorityFilter !== "All") {
    filtered = filtered.filter(
      (e) => e.priority.toLowerCase() === priorityFilter.toLowerCase()
    );
  }

  // Action required filter
  if (actionFilter === "true") {
    filtered = filtered.filter((e) => e.action_required === true);
  } else if (actionFilter === "false") {
    filtered = filtered.filter((e) => e.action_required === false);
  }

  // Text search
  if (searchQuery) {
    filtered = filtered.filter((e) => {
      return (
        e.subject.toLowerCase().includes(searchQuery) ||
        e.sender.toLowerCase().includes(searchQuery) ||
        e.summary.toLowerCase().includes(searchQuery)
      );
    });
  }

  // Compute metrics across all user emails (before query filtering)
  const metrics = {
    total: emails.length,
    highPriority: emails.filter((e) => e.priority === "High").length,
    actionRequired: emails.filter((e) => e.action_required).length,
    categories: {
      Important: emails.filter((e) => e.category === "Important").length,
      Work: emails.filter((e) => e.category === "Work").length,
      Transactions: emails.filter((e) => e.category === "Transactions").length,
      Promotions: emails.filter((e) => e.category === "Promotions").length,
      Updates: emails.filter((e) => e.category === "Updates").length,
    },
  };

  return NextResponse.json({
    emails: filtered,
    totalCount: filtered.length,
    metrics,
    isUsingDemoFallback: emails === DEMO_EMAILS,
  });
}
