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

    // SECURITY: Enforce folder-level access firewall
    const lockedFolderId = session.folder_id;
    if (!lockedFolderId) {
      return NextResponse.json(
        { error: "No folder locked. Please select a folder first.", requiresLock: true },
        { status: 403 }
      );
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
    const folderId = request.nextUrl.searchParams.get("folderId") || lockedFolderId;

    // SECURITY: Verify requested folder is within the locked folder tree
    if (folderId !== lockedFolderId) {
      const isDescendant = await verifyDescendant(drive, folderId, lockedFolderId);
      if (!isDescendant) {
        return NextResponse.json(
          { error: "Access denied. This folder is outside your approved access scope." },
          { status: 403 }
        );
      }
    }

    let q = `trashed = false and '${folderId}' in parents`;
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
      lockedFolder: {
        id: lockedFolderId,
        name: session.folder_name,
      },
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

// POST (upload) is intentionally removed — this app is READ-ONLY

/**
 * Verify that a folder is a descendant of the locked root folder.
 * Walks up the parent chain to check containment (max 10 levels deep).
 */
async function verifyDescendant(
  drive: ReturnType<typeof google.drive>,
  childId: string,
  rootId: string
): Promise<boolean> {
  let currentId = childId;
  for (let i = 0; i < 10; i++) {
    try {
      const file = await drive.files.get({
        fileId: currentId,
        fields: "parents",
      });
      const parents = file.data.parents;
      if (!parents || parents.length === 0) return false;
      if (parents.includes(rootId)) return true;
      currentId = parents[0];
    } catch {
      return false;
    }
  }
  return false;
}
