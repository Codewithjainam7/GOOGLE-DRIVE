import { google } from "googleapis";

export function createOAuth2Client() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );
}

// Access scopes: read-only Drive + Sheets write (for invoice report export)
export const SCOPES = [
  "https://www.googleapis.com/auth/drive.readonly",
  "https://www.googleapis.com/auth/drive.file",
  "https://www.googleapis.com/auth/spreadsheets",
  "https://www.googleapis.com/auth/userinfo.email",
  "https://www.googleapis.com/auth/userinfo.profile",
];

export function getAuthUrl() {
  const client = createOAuth2Client();
  return client.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES,
    prompt: "consent",
  });
}

export function createAuthedClient(tokens: {
  access_token: string;
  refresh_token?: string;
}) {
  const client = createOAuth2Client();
  client.setCredentials(tokens);
  return client;
}

/**
 * Extract a Google Drive folder ID from various URL formats:
 *  - https://drive.google.com/drive/folders/FOLDER_ID
 *  - https://drive.google.com/drive/u/0/folders/FOLDER_ID
 *  - https://drive.google.com/open?id=FOLDER_ID
 *  - Raw folder ID string
 */
export function extractFolderIdFromLink(input: string): string | null {
  if (!input || !input.trim()) return null;
  const trimmed = input.trim();

  // Pattern: /folders/FOLDER_ID
  const foldersMatch = trimmed.match(/\/folders\/([a-zA-Z0-9_-]+)/);
  if (foldersMatch) return foldersMatch[1];

  // Pattern: ?id=FOLDER_ID
  const idMatch = trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (idMatch) return idMatch[1];

  // Raw folder ID (alphanumeric, dashes, underscores, typically 20+ chars)
  if (/^[a-zA-Z0-9_-]{10,}$/.test(trimmed)) return trimmed;

  return null;
}
