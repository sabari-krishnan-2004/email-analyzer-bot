import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import { getGoogleOAuthClient } from "@/lib/gmail";
import { encrypt } from "@/lib/crypto";
import { getSupabaseAdmin } from "@/lib/supabase";
import { createSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin;

  if (error) {
    console.error("Google OAuth error parameter received:", error);
    return NextResponse.redirect(`${baseUrl}/?error=${encodeURIComponent(error)}`);
  }

  if (!code) {
    return NextResponse.redirect(`${baseUrl}/?error=missing_auth_code`);
  }

  try {
    const oauth2Client = getGoogleOAuthClient();

    // 1. Exchange authorization code for tokens
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    // 2. Fetch authenticated user's email via Google OAuth2 UserInfo API
    const oauth2 = google.oauth2({ version: "v2", auth: oauth2Client });
    const userInfoRes = await oauth2.userinfo.get();
    const userEmail = userInfoRes.data.email;

    if (!userEmail) {
      throw new Error("Unable to retrieve email from Google user profile.");
    }

    const supabase = getSupabaseAdmin();

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from("users")
      .select("id, refresh_token")
      .eq("email", userEmail)
      .maybeSingle();

    // Encrypt refresh token
    let encryptedRefreshToken = existingUser?.refresh_token;

    if (tokens.refresh_token) {
      encryptedRefreshToken = encrypt(tokens.refresh_token);
    }

    if (!encryptedRefreshToken) {
      // Prompt consent might have been skipped; user has to reconnect
      return NextResponse.redirect(
        `${baseUrl}/?error=${encodeURIComponent(
          "Google did not provide a refresh token. Please re-authenticate and ensure all permissions are granted."
        )}`
      );
    }

    // 3. Upsert into public.users
    const { data: userRecord, error: upsertError } = await supabase
      .from("users")
      .upsert(
        {
          email: userEmail,
          refresh_token: encryptedRefreshToken,
        },
        { onConflict: "email" }
      )
      .select("id, email")
      .single();

    if (upsertError || !userRecord) {
      console.error("Supabase user upsert error:", upsertError);
      throw new Error(`Failed to save user in database: ${upsertError?.message}`);
    }

    // 4. Create session cookie
    await createSession({
      userId: userRecord.id,
      email: userRecord.email,
    });

    // 5. Redirect to dashboard
    return NextResponse.redirect(`${baseUrl}/dashboard?auth=success`);
  } catch (err: any) {
    console.error("OAuth callback error:", err);
    return NextResponse.redirect(
      `${baseUrl}/?error=${encodeURIComponent(err?.message || "oauth_failed")}`
    );
  }
}
