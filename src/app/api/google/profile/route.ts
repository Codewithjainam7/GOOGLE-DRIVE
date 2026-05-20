import { NextResponse } from "next/server";
import { getSession, maskToken } from "@/lib/session";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ connected: false }, { status: 200 });
    }

    return NextResponse.json({
      connected: true,
      email: session.email,
      name: session.name,
      picture: session.picture,
      connected_at: session.connected_at,
      scopes: session.scopes,
      token_masked: maskToken(session.access_token),
      refresh_token_present: !!session.refresh_token,
      expiry_date: session.expiry_date,
      // Folder lock status
      folder_id: session.folder_id || null,
      folder_name: session.folder_name || null,
      folder_link: session.folder_link || null,
    });
  } catch (error) {
    console.error("Profile error:", error);
    return NextResponse.json(
      { error: "Failed to fetch profile" },
      { status: 500 }
    );
  }
}
