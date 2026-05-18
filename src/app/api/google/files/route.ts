import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import { createAuthedClient } from "@/lib/google";
import { getSession } from "@/lib/session";
import { Readable } from "stream";

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

export async function POST(request: NextRequest) {
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

    const formData = await request.formData();
    const file = formData.get("file") as File;
    if (!file) {
      return NextResponse.json({ error: "No file provided in form-data" }, { status: 400 });
    }

    // Convert file to a readable buffer stream
    const buffer = Buffer.from(await file.arrayBuffer());
    const stream = Readable.from(buffer);

    const response = await drive.files.create({
      requestBody: {
        name: file.name,
        mimeType: file.type || "application/octet-stream",
      },
      media: {
        mimeType: file.type || "application/octet-stream",
        body: stream,
      },
      fields: "id, name, mimeType, modifiedTime, size, owners, iconLink, webViewLink",
    });

    return NextResponse.json({
      success: true,
      file: response.data,
    });
  } catch (error: unknown) {
    console.error("Drive upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload file to Google Drive" },
      { status: 500 }
    );
  }
}
