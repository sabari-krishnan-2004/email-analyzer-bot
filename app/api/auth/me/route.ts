import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ authenticated: false, user: null }, { status: 401 });
  }

  // If Supabase is configured, fetch fresh user record from DB
  if (isSupabaseConfigured()) {
    try {
      const supabase = getSupabaseAdmin();
      const { data: user, error } = await supabase
        .from("users")
        .select("id, email, last_synced_at, created_at")
        .eq("id", session.userId)
        .single();

      if (!error && user) {
        return NextResponse.json({
          authenticated: true,
          user: {
            id: user.id,
            email: user.email,
            lastSyncedAt: user.last_synced_at,
            createdAt: user.created_at,
          },
        });
      }
    } catch (err) {
      console.error("Error fetching user details:", err);
    }
  }

  // Fallback to session data
  return NextResponse.json({
    authenticated: true,
    user: {
      id: session.userId,
      email: session.email,
      lastSyncedAt: null,
      createdAt: new Date().toISOString(),
    },
  });
}
