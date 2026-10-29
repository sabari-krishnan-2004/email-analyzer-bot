import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import { UserSession } from "@/types";

const COOKIE_NAME = "ai_email_session";
const JWT_SECRET = new TextEncoder().encode(
  process.env.SESSION_SECRET ||
    process.env.ENCRYPTION_KEY ||
    "default-super-secret-jwt-key-minimum-32-characters!!"
);

/**
 * Creates and sets a secure HTTP-only session cookie for the authenticated user.
 */
export async function createSession(user: {
  userId: string;
  email: string;
}): Promise<void> {
  const token = await new SignJWT({
    userId: user.userId,
    email: user.email,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(JWT_SECRET);

  const cookieStore = cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });
}

/**
 * Retrieves and validates the current session from the HTTP-only cookie.
 */
export async function getSession(): Promise<UserSession | null> {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;

    if (!token) {
      return null;
    }

    const { payload } = await jwtVerify(token, JWT_SECRET);

    if (payload && payload.userId && payload.email) {
      return {
        userId: payload.userId as string,
        email: payload.email as string,
      };
    }

    return null;
  } catch (error) {
    return null;
  }
}

/**
 * Clears the user session cookie upon logout.
 */
export async function clearSession(): Promise<void> {
  const cookieStore = cookies();
  cookieStore.delete(COOKIE_NAME);
}
