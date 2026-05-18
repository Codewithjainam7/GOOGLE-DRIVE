import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import { createAuthedClient } from "@/lib/google";
import { getSession } from "@/lib/session";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const client = createAuthedClient({
      access_token: session.access_token,
      refresh_token: session.refresh_token,
    });

    const drive = google.drive({ version: "v3", auth: client });

    const pageToken = request.nextUrl.searchParams.get("pageToken") || undefined;
    const query = request.nextUrl.searchParams.get("q") || undefined;
    const pageSize = parseInt(request.nextUrl.searchParams.get("pageSize") || "20");
    const orderBy = request.nextUrl.searchParams.get("orderBy") || "modifiedTime desc";
    const folderId = request.nextUrl.searchParams.get("folderId") || undefined;

    let q = "trashed = false";
    if (folderId) {
      q += ` and '${folderId}' in parents`;
    }
    if (query) {
      q += ` and name contains '${query.replace(/'/g, "\\'")}'`;
    }

    const response = await drive.files.list({
      pageSize,
      pageToken,
      orderBy,
      q,
      fields:
        "nextPageToken, files(id, name, mimeType, modifiedTime, size, owners, iconLink, webViewLink, thumbnailLink, parents)",
    });

    return NextResponse.json({
      files: response.data.files || [],
      nextPageToken: response.data.nextPageToken || null,
    });
  } catch (error: unknown) {
    console.error("Drive files error:", error);
    const status = (error as { code?: number })?.code === 401 ? 401 : 500;
    return NextResponse.json(
      { error: "Failed to fetch files" },
      { status }
    );
  }
}
