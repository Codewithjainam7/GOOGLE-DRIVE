import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const SECRET = new TextEncoder().encode(
  process.env.SESSION_SECRET || "fallback-secret-key-change-in-production-32"
);

const COOKIE_NAME = "gdrive_session";

export interface SessionPayload {
  access_token: string;
  refresh_token?: string;
  expiry_date?: number;
  email?: string;
  name?: string;
  picture?: string;
  connected_at?: string;
  scopes?: string[];
}

export async function createSession(payload: SessionPayload) {
  const token = await new SignJWT(payload as unknown as Record<string, unknown>)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(SECRET);

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  });
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, SECRET);
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

export async function deleteSession() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export function maskToken(token: string): string {
  if (!token || token.length < 12) return "••••••••••••";
  return token.slice(0, 6) + "••••••••••••" + token.slice(-4);
}
