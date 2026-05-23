import { NextResponse } from "next/server";
import { google } from "googleapis";
import { createAuthedClient } from "@/lib/google";
import { getSession } from "@/lib/session";

/**
 * Invoice/receipt/bill file detection keywords.
 * Files whose names contain any of these (case-insensitive) are considered relevant.
 */
const INVOICE_KEYWORDS = [
  "invoice", "receipt", "bill", "strata", "council", "expense",
  "payment", "tax", "levy", "fee", "charge", "statement",
  "debit", "credit", "remittance", "purchase", "order",
];

/**
 * Allowed MIME types for invoice documents.
 */
const INVOICE_MIME_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/tiff",
  "application/vnd.google-apps.document", // Google Docs (could be an invoice)
];

interface ScannedFile {
  id: string;
  name: string;
  mimeType: string;
  folderPath: string;
  modifiedTime?: string;
  size?: string;
  webViewLink?: string;
  thumbnailLink?: string;
  extractedAmount?: number | null;
}

/**
 * Extract dollar amount from filename, e.g. "Strata Jan $4.pdf" → 4
 */
function extractAmountFromName(name: string): number | null {
  // Match patterns like $4, $4.50, $15, $15.00, $1,250.00
  const match = name.match(/\$\s*([\d,]+(?:\.\d{1,2})?)/);
  if (match) {
    return parseFloat(match[1].replace(/,/g, ""));
  }
  return null;
}

/**
 * Check if a file is likely an invoice/bill/receipt based on name and MIME type.
 */
function isInvoiceFile(name: string, mimeType: string): boolean {
  // Must be a document type (PDF, image, Google Doc)
  const isAllowedType = INVOICE_MIME_TYPES.some((t) => mimeType.startsWith(t));
  if (!isAllowedType) return false;

  // Check if filename contains any invoice-related keyword
  const lower = name.toLowerCase();
  return INVOICE_KEYWORDS.some((kw) => lower.includes(kw));
}

/**
 * Recursively walk a Google Drive folder tree and collect invoice files.
 * Builds full folder path strings like "Expenses Council\extra folder under council".
 */
async function walkFolder(
  drive: ReturnType<typeof google.drive>,
  folderId: string,
  currentPath: string,
  results: ScannedFile[],
  folderCount: { value: number },
  maxDepth: number = 10,
  depth: number = 0
): Promise<void> {
  if (depth > maxDepth) return;

  let pageToken: string | undefined;

  do {
    const response = await drive.files.list({
      q: `'${folderId}' in parents and trashed = false`,
      fields:
        "nextPageToken, files(id, name, mimeType, modifiedTime, size, webViewLink, thumbnailLink, parents)",
      pageSize: 1000,
      pageToken,
      orderBy: "name",
    });

    const files = response.data.files || [];
    pageToken = response.data.nextPageToken || undefined;

    for (const file of files) {
      if (file.mimeType === "application/vnd.google-apps.folder") {
        // It's a subfolder — recurse into it
        folderCount.value++;
        await walkFolder(
          drive,
          file.id!,
          currentPath ? `${currentPath}\\${file.name}` : file.name!,
          results,
          folderCount,
          maxDepth,
          depth + 1
        );
      } else if (isInvoiceFile(file.name || "", file.mimeType || "")) {
        // It's an invoice/bill/receipt — add to results
        results.push({
          id: file.id!,
          name: file.name!,
          mimeType: file.mimeType!,
          folderPath: currentPath || "(root)",
          modifiedTime: file.modifiedTime || undefined,
          size: file.size || undefined,
          webViewLink: file.webViewLink || undefined,
          thumbnailLink: file.thumbnailLink || undefined,
          extractedAmount: extractAmountFromName(file.name || ""),
        });
      }
    }
  } while (pageToken);
}

/**
 * POST /api/google/scan-invoices
 * Recursively scans the locked folder for invoices/bills/receipts.
 */
export async function POST() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const lockedFolderId = session.folder_id;
    const lockedFolderName = session.folder_name;

    if (!lockedFolderId) {
      return NextResponse.json(
        { error: "No folder locked. Please lock a folder first." },
        { status: 403 }
      );
    }

    const client = createAuthedClient({
      access_token: session.access_token,
      refresh_token: session.refresh_token,
    });

    const drive = google.drive({ version: "v3", auth: client });

    const results: ScannedFile[] = [];
    const folderCount = { value: 1 }; // count the root folder

    await walkFolder(drive, lockedFolderId, lockedFolderName || "", results, folderCount);

    // Sort by folder path then file name
    results.sort((a, b) => {
      const pathCmp = a.folderPath.localeCompare(b.folderPath);
      if (pathCmp !== 0) return pathCmp;
      return a.name.localeCompare(b.name);
    });

    // Calculate totals
    const totalAmount = results.reduce((sum, f) => sum + (f.extractedAmount || 0), 0);

    return NextResponse.json({
      success: true,
      invoices: results,
      summary: {
        totalInvoices: results.length,
        totalFoldersScanned: folderCount.value,
        totalAmount,
        rootFolder: lockedFolderName,
      },
    });
  } catch (error: unknown) {
    console.error("Scan invoices error:", error);
    return NextResponse.json(
      { error: "Failed to scan invoices" },
      { status: 500 }
    );
  }
}
