import { google } from "googleapis";
import { OAuth2Client } from "google-auth-library";
import { decrypt } from "./crypto";
import { RawParsedEmail } from "@/types";

const SCOPES = [
  "openid",
  "https://www.googleapis.com/auth/userinfo.email",
  "https://www.googleapis.com/auth/gmail.readonly",
];

/**
 * Returns a configured Google OAuth2 Client.
 */
export function getGoogleOAuthClient(): OAuth2Client {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI;

  if (!clientId || !clientSecret || !redirectUri) {
    throw new Error(
      "Missing Google OAuth environment variables: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, or GOOGLE_REDIRECT_URI."
    );
  }

  return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
}

/**
 * Generates the Google OAuth authorization URL requesting offline access
 * and consent prompt to ensure a refresh_token is returned.
 */
export function getAuthUrl(state?: string): string {
  const oauth2Client = getGoogleOAuthClient();
  return oauth2Client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: SCOPES,
    include_granted_scopes: true,
    ...(state ? { state } : {}),
  });
}

/**
 * Decrypts the stored refresh token, sets credentials on the OAuth client,
 * and fetches a fresh access token.
 */
export async function refreshAccessToken(
  encryptedRefreshToken: string
): Promise<string> {
  const refreshToken = decrypt(encryptedRefreshToken);
  const oauth2Client = getGoogleOAuthClient();

  oauth2Client.setCredentials({
    refresh_token: refreshToken,
  });

  const { credentials } = await oauth2Client.refreshAccessToken();
  if (!credentials.access_token) {
    throw new Error("Failed to acquire fresh access token using refresh token.");
  }

  return credentials.access_token;
}

/**
 * Strips HTML tags and excessive whitespace from a string.
 */
function cleanHtml(raw: string): string {
  return raw
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Decodes Gmail base64/base64url payload body safely.
 */
function decodeBase64(data: string): string {
  try {
    const sanitized = data.replace(/-/g, "+").replace(/_/g, "/");
    return Buffer.from(sanitized, "base64").toString("utf-8");
  } catch {
    return "";
  }
}

/**
 * Extracts plain text content from Gmail message payload parts recursively.
 */
function extractBody(payload: any): string {
  if (!payload) return "";

  // Direct body data
  if (payload.body && payload.body.data) {
    const text = decodeBase64(payload.body.data);
    if (payload.mimeType === "text/html") {
      return cleanHtml(text);
    }
    return text;
  }

  // Multipart exploration
  if (payload.parts && Array.isArray(payload.parts)) {
    // 1. Prefer text/plain
    for (const part of payload.parts) {
      if (part.mimeType === "text/plain" && part.body?.data) {
        return decodeBase64(part.body.data);
      }
    }

    // 2. Fall back to text/html
    for (const part of payload.parts) {
      if (part.mimeType === "text/html" && part.body?.data) {
        return cleanHtml(decodeBase64(part.body.data));
      }
    }

    // 3. Recurse into nested parts (e.g. multipart/related, multipart/alternative)
    for (const part of payload.parts) {
      const nested = extractBody(part);
      if (nested) return nested;
    }
  }

  return "";
}

/**
 * Fetches unread emails from the past 24 hours (or matching custom query),
 * decodes message headers and body, and truncates text to 1,500 chars.
 */
export async function fetchUnreadEmails(
  accessToken: string,
  query: string = "label:INBOX is:unread newer_than:1d"
): Promise<RawParsedEmail[]> {
  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: accessToken });

  const gmail = google.gmail({ version: "v1", auth });

  // 1. List message IDs matching query
  const listRes = await gmail.users.messages.list({
    userId: "me",
    q: query,
    maxResults: 50,
  });

  const messagesList = listRes.data.messages || [];
  if (messagesList.length === 0) {
    return [];
  }

  // 2. Fetch full message details in parallel chunks
  const parsedEmails: RawParsedEmail[] = [];

  for (const item of messagesList) {
    if (!item.id) continue;

    try {
      const msgRes = await gmail.users.messages.get({
        userId: "me",
        id: item.id,
        format: "full",
      });

      const message = msgRes.data;
      const headers = message.payload?.headers || [];

      const getHeader = (name: string): string => {
        const found = headers.find(
          (h) => h.name?.toLowerCase() === name.toLowerCase()
        );
        return found?.value || "";
      };

      const sender = getHeader("From") || "Unknown Sender";
      const subject = getHeader("Subject") || "(No Subject)";
      const dateHeader = getHeader("Date");
      const date = dateHeader
        ? new Date(dateHeader).toISOString()
        : new Date(Number(message.internalDate) || Date.now()).toISOString();

      let body = extractBody(message.payload);
      if (!body && message.snippet) {
        body = message.snippet;
      }

      // Truncate to first 1,500 characters to keep LLM context clean and cost-free
      const truncatedBody = body.substring(0, 1500).trim();

      parsedEmails.push({
        id: message.id!,
        threadId: message.threadId ?? undefined,
        sender,
        subject,
        date,
        bodySnippet: truncatedBody || "(Empty email content)",
      });
    } catch (err) {
      console.error(`Error fetching Gmail message ID ${item.id}:`, err);
    }
  }

  return parsedEmails;
}
