import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import { createOAuth2Client, SCOPES } from "@/lib/google";
import { createSession } from "@/lib/session";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const error = request.nextUrl.searchParams.get("error");
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  if (error) {
    return NextResponse.redirect(
      `${appUrl}/?error=${encodeURIComponent(error)}`
    );
  }

  if (!code) {
    return NextResponse.redirect(
      `${appUrl}/?error=${encodeURIComponent("No authorization code received")}`
    );
  }

  try {
    const client = createOAuth2Client();
    const { tokens } = await client.getToken(code);
    client.setCredentials(tokens);

    // Get user profile
    const oauth2 = google.oauth2({ version: "v2", auth: client });
    const { data: profile } = await oauth2.userinfo.get();

    await createSession({
      access_token: tokens.access_token!,
      refresh_token: tokens.refresh_token || undefined,
      expiry_date: tokens.expiry_date || undefined,
      email: profile.email || undefined,
      name: profile.name || undefined,
      picture: profile.picture || undefined,
      connected_at: new Date().toISOString(),
      scopes: SCOPES,
    });

    return NextResponse.redirect(`${appUrl}/?connected=true`);
  } catch (err) {
    console.error("OAuth callback error:", err);
    return NextResponse.redirect(
      `${appUrl}/?error=${encodeURIComponent("Authentication failed")}`
    );
  }
}
