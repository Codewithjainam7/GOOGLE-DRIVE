import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import { createAuthedClient } from "@/lib/google";
import { getSession } from "@/lib/session";

/**
 * GET /api/google/thumbnail?fileId=xxx
 * Proxies Google Drive file thumbnails through our authenticated backend.
 * Returns the thumbnail image with proper content-type headers.
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const fileId = request.nextUrl.searchParams.get("fileId");
    if (!fileId) {
      return NextResponse.json({ error: "fileId required" }, { status: 400 });
    }

    const client = createAuthedClient({
      access_token: session.access_token,
      refresh_token: session.refresh_token,
    });

    const drive = google.drive({ version: "v3", auth: client });

    // Get the thumbnail link
    const fileMeta = await drive.files.get({
      fileId,
      fields: "thumbnailLink",
    });

    let thumbnailUrl = fileMeta.data.thumbnailLink;
    if (!thumbnailUrl) {
      return NextResponse.json({ error: "No thumbnail available" }, { status: 404 });
    }

    // Request higher resolution thumbnail (replace s220 with s800)
    thumbnailUrl = thumbnailUrl.replace(/=s\d+$/, "=s800");

    // Fetch the thumbnail image with auth
    const token = (await client.getAccessToken()).token;
    const imageRes = await fetch(thumbnailUrl, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!imageRes.ok) {
      return NextResponse.json({ error: "Failed to fetch thumbnail" }, { status: 502 });
    }

    const imageBuffer = await imageRes.arrayBuffer();
    const contentType = imageRes.headers.get("content-type") || "image/png";

    return new NextResponse(imageBuffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (error: unknown) {
    console.error("Thumbnail proxy error:", error);
    return NextResponse.json({ error: "Failed to fetch thumbnail" }, { status: 500 });
  }
}
