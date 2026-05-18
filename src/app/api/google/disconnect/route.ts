import { NextResponse } from "next/server";
import { deleteSession, getSession } from "@/lib/session";
import { createAuthedClient } from "@/lib/google";

export async function POST() {
  try {
    const session = await getSession();

    if (session) {
      // Attempt to revoke the token
      try {
        const client = createAuthedClient({
          access_token: session.access_token,
        });
        await client.revokeToken(session.access_token);
      } catch {
        // Token revocation may fail if already expired — that's OK
      }
    }

    await deleteSession();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Disconnect error:", error);
    return NextResponse.json(
      { error: "Failed to disconnect" },
      { status: 500 }
    );
  }
}
