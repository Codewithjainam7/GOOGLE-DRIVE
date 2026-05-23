import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import { createAuthedClient, extractFolderIdFromLink } from "@/lib/google";
import { getSession, updateSession } from "@/lib/session";

/**
 * POST /api/google/lock
 * Verifies a folder ID or link and locks the session to that folder.
 * Body: { folderId?: string, folderLink?: string }
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await request.json();
    const rawInput = body.folderLink || body.folderId || "";

    // Extract folder ID from link or raw ID
    const folderId = extractFolderIdFromLink(rawInput);
    if (!folderId) {
      return NextResponse.json(
        { error: "Invalid folder link or ID. Please paste a valid Google Drive folder URL." },
        { status: 400 }
      );
    }

    // Verify folder exists and user has access via Google Drive API
    const client = createAuthedClient({
      access_token: session.access_token,
      refresh_token: session.refresh_token,
    });

    const drive = google.drive({ version: "v3", auth: client });

    try {
      const folderMeta = await drive.files.get({
        fileId: folderId,
        fields: "id, name, mimeType, webViewLink",
      });

      // Ensure it's actually a folder
      if (folderMeta.data.mimeType !== "application/vnd.google-apps.folder") {
        return NextResponse.json(
          { error: "The provided link points to a file, not a folder. Please select a folder." },
          { status: 400 }
        );
      }

      // Lock the session to this folder
      const folderLink = folderMeta.data.webViewLink || rawInput;
      await updateSession({
        folder_id: folderId,
        folder_name: folderMeta.data.name || "Unnamed Folder",
        folder_link: folderLink,
      });

      return NextResponse.json({
        success: true,
        folder: {
          id: folderId,
          name: folderMeta.data.name,
          link: folderLink,
        },
      });
    } catch (driveError: unknown) {
      const code = (driveError as { code?: number })?.code;
      if (code === 404) {
        return NextResponse.json(
          { error: "This folder was not found in your connected Google account. Make sure the folder belongs to the account you signed in with, or that it has been shared with you." },
          { status: 404 }
        );
      }
      if (code === 403) {
        return NextResponse.json(
          { error: "You don't have permission to access this folder. It may belong to a different Google account. Please check that you're signed in with the correct account." },
          { status: 403 }
        );
      }
      throw driveError;
    }
  } catch (error: unknown) {
    console.error("Folder lock error:", error);
    return NextResponse.json(
      { error: "Failed to lock folder" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/google/lock
 * Removes the folder lock from the session (allows re-selection).
 */
export async function DELETE() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    await updateSession({
      folder_id: undefined,
      folder_name: undefined,
      folder_link: undefined,
    });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error("Folder unlock error:", error);
    return NextResponse.json(
      { error: "Failed to unlock folder" },
      { status: 500 }
    );
  }
}
