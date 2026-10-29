import { NextRequest, NextResponse } from "next/server";
import { getAuthUrl } from "@/lib/gmail";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const authUrl = getAuthUrl();
    return NextResponse.redirect(authUrl);
  } catch (error: any) {
    console.warn("Google OAuth credentials missing:", error?.message);
    const origin = request.nextUrl.origin || "http://localhost:3000";
    const redirectUrl = new URL("/", origin);
    redirectUrl.searchParams.set(
      "error",
      "Google OAuth is not configured yet in .env.local. Add your GOOGLE_CLIENT_ID & GOOGLE_CLIENT_SECRET, or click 'Live Demo' to explore full triaged emails right now!"
    );
    return NextResponse.redirect(redirectUrl.toString());
  }
}

