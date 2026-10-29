import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase";
import { fetchUnreadEmails, refreshAccessToken } from "@/lib/gmail";
import { classifyEmail } from "@/lib/classifier";
import { getSession } from "@/lib/session";
import { RawParsedEmail, SyncResult, UserRecord } from "@/types";

export const dynamic = "force-dynamic";
export const maxDuration = 60; // Allow Vercel function up to 60s for batch processing

/**
 * Helper to pause execution between LLM calls to prevent rate limiting.
 */
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Synchronizes emails for a single user:
 * 1. Decrypts refresh token and gets fresh access token.
 * 2. Fetches unread emails from the past 24 hours.
 * 3. Filters out already stored emails to prevent duplicate LLM calls.
 * 4. Batches and classifies new emails with Gemini 1.5 Flash.
 * 5. Upserts results into public.emails and updates users.last_synced_at.
 */
async function syncUserEmails(user: UserRecord): Promise<SyncResult> {
  const startTime = Date.now();
  const errors: string[] = [];
  const supabase = getSupabaseAdmin();

  try {
    // 1. Refresh access token
    const accessToken = await refreshAccessToken(user.refresh_token);

    // 2. Fetch unread emails from last 24h
    const rawEmails: RawParsedEmail[] = await fetchUnreadEmails(
      accessToken,
      "label:INBOX is:unread newer_than:1d"
    );

    if (rawEmails.length === 0) {
      await supabase
        .from("users")
        .update({ last_synced_at: new Date().toISOString() })
        .eq("id", user.id);

      return {
        success: true,
        userEmail: user.email,
        totalFetched: 0,
        newEmailsClassified: 0,
        skippedAlreadyProcessed: 0,
        durationMs: Date.now() - startTime,
      };
    }

    // 3. Filter out messages already present in the database to prevent duplicate LLM calls
    const messageIds = rawEmails.map((e) => e.id);
    const { data: existingRecords, error: fetchExistingError } = await supabase
      .from("emails")
      .select("gmail_message_id")
      .eq("user_id", user.id)
      .in("gmail_message_id", messageIds);

    if (fetchExistingError) {
      console.warn("Error fetching existing email records:", fetchExistingError);
    }

    const existingIdSet = new Set(
      existingRecords?.map((r) => r.gmail_message_id) || []
    );

    const newEmails = rawEmails.filter((e) => !existingIdSet.has(e.id));
    const skippedCount = rawEmails.length - newEmails.length;

    if (newEmails.length === 0) {
      await supabase
        .from("users")
        .update({ last_synced_at: new Date().toISOString() })
        .eq("id", user.id);

      return {
        success: true,
        userEmail: user.email,
        totalFetched: rawEmails.length,
        newEmailsClassified: 0,
        skippedAlreadyProcessed: skippedCount,
        durationMs: Date.now() - startTime,
      };
    }

    // 4. Batch Gemini classification in chunks of 3-4 with slight pacing
    const BATCH_SIZE = 3;
    const classifiedRows: any[] = [];

    for (let i = 0; i < newEmails.length; i += BATCH_SIZE) {
      const batch = newEmails.slice(i, i + BATCH_SIZE);

      const batchPromises = batch.map(async (email) => {
        try {
          const classification = await classifyEmail({
            sender: email.sender,
            subject: email.subject,
            content: email.bodySnippet,
          });

          return {
            user_id: user.id,
            gmail_message_id: email.id,
            sender: email.sender,
            subject: email.subject,
            received_at: email.date,
            category: classification.category,
            priority: classification.priority,
            summary: classification.summary,
            action_required: classification.action_required,
            is_read: false,
          };
        } catch (err: any) {
          errors.push(
            `Classification error for message ${email.id}: ${err?.message}`
          );
          return null;
        }
      });

      const batchResults = await Promise.all(batchPromises);
      for (const res of batchResults) {
        if (res) classifiedRows.push(res);
      }

      // Slight pacing (350ms) between batches to respect free tier RPM
      if (i + BATCH_SIZE < newEmails.length) {
        await delay(350);
      }
    }

    // 5. Upsert classified emails into public.emails
    if (classifiedRows.length > 0) {
      const { error: upsertEmailError } = await supabase
        .from("emails")
        .upsert(classifiedRows, {
          onConflict: "user_id,gmail_message_id",
        });

      if (upsertEmailError) {
        throw new Error(
          `Failed to store classified emails: ${upsertEmailError.message}`
        );
      }
    }

    // 6. Update last_synced_at timestamp in users table
    await supabase
      .from("users")
      .update({ last_synced_at: new Date().toISOString() })
      .eq("id", user.id);

    return {
      success: true,
      userEmail: user.email,
      totalFetched: rawEmails.length,
      newEmailsClassified: classifiedRows.length,
      skippedAlreadyProcessed: skippedCount,
      errors: errors.length > 0 ? errors : undefined,
      durationMs: Date.now() - startTime,
    };
  } catch (err: any) {
    console.error(`Sync error for user ${user.email}:`, err);
    return {
      success: false,
      userEmail: user.email,
      totalFetched: 0,
      newEmailsClassified: 0,
      skippedAlreadyProcessed: 0,
      errors: [err?.message || "Unknown sync failure"],
      durationMs: Date.now() - startTime,
    };
  }
}

/**
 * GET Handler: Invoked by Vercel Cron
 * Header required: Authorization: Bearer <CRON_SECRET>
 */
export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");

  // Verify CRON_SECRET if configured
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json(
      { error: "Unauthorized: Invalid or missing CRON_SECRET header" },
      { status: 401 }
    );
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Supabase is not configured yet. Set environment variables." },
      { status: 503 }
    );
  }

  try {
    const supabase = getSupabaseAdmin();

    // Fetch all registered users
    const { data: users, error } = await supabase
      .from("users")
      .select("id, email, refresh_token, last_synced_at, created_at");

    if (error) {
      throw error;
    }

    if (!users || users.length === 0) {
      return NextResponse.json({
        message: "No users registered to sync.",
        processedUsers: 0,
      });
    }

    const results: SyncResult[] = [];
    for (const user of users) {
      const res = await syncUserEmails(user);
      results.push(res);
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      processedUsers: users.length,
      results,
    });
  } catch (err: any) {
    console.error("Cron sync execution failure:", err);
    return NextResponse.json(
      { error: "Cron sync failed", details: err?.message },
      { status: 500 }
    );
  }
}

/**
 * POST Handler: Invoked manually by dashboard "Sync Now" button
 * Authenticated via current user session cookie.
 */
export async function POST(request: NextRequest) {
  const session = await getSession();

  if (!session) {
    // If not authenticated, return simulated sync result for demo exploration
    return NextResponse.json({
      success: true,
      simulated: true,
      userEmail: "demo-executive@company.io",
      totalFetched: 8,
      newEmailsClassified: 8,
      skippedAlreadyProcessed: 0,
      message: "Sync simulated successfully in demo mode! (Connect Google OAuth to sync your live Gmail inbox).",
    });
  }

  if (!isSupabaseConfigured()) {
    // Return sample/mock sync result if Supabase is not yet connected
    return NextResponse.json({
      success: true,
      simulated: true,
      userEmail: session.email,
      totalFetched: 8,
      newEmailsClassified: 8,
      skippedAlreadyProcessed: 0,
      message: "Sync simulated successfully (Supabase credentials pending configuration).",
    });
  }

  try {
    const supabase = getSupabaseAdmin();

    const { data: user, error } = await supabase
      .from("users")
      .select("id, email, refresh_token, last_synced_at, created_at")
      .eq("id", session.userId)
      .single();

    if (error || !user) {
      return NextResponse.json(
        { error: "User record not found in database." },
        { status: 404 }
      );
    }

    const result = await syncUserEmails(user);

    return NextResponse.json({
      success: result.success,
      result,
    });
  } catch (err: any) {
    console.error("Manual sync failure:", err);
    return NextResponse.json(
      { error: "Manual sync failed", details: err?.message },
      { status: 500 }
    );
  }
}
