import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import { createAuthedClient } from "@/lib/google";
import { getSession } from "@/lib/session";

interface InvoiceRow {
  folderPath: string;
  fileName?: string;
  name?: string;
  extractedAmount?: number | null;
  modifiedTime?: string;
  webViewLink?: string;
  thumbnailLink?: string;
  company?: string | null;
  invoiceNumber?: string | null;
  date?: string | null;
  subtotal?: number | null;
  taxPercent?: number | null;
  taxAmount?: number | null;
  total?: number | null;
}

/**
 * POST /api/google/export-sheet
 * Creates a Google Sheets spreadsheet with the scanned invoice data.
 * Places the sheet inside the locked folder.
 *
 * Body: { invoices: InvoiceRow[], rootFolderName: string }
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const lockedFolderId = session.folder_id;
    if (!lockedFolderId) {
      return NextResponse.json(
        { error: "No folder locked." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const invoices: InvoiceRow[] = body.invoices || [];
    const rootFolderName: string = body.rootFolderName || "Drive Folder";

    if (invoices.length === 0) {
      return NextResponse.json(
        { error: "No invoices to export." },
        { status: 400 }
      );
    }

    const client = createAuthedClient({
      access_token: session.access_token,
      refresh_token: session.refresh_token,
    });

    const drive = google.drive({ version: "v3", auth: client });
    const sheets = google.sheets({ version: "v4", auth: client });

    // ── Step 1: Create the spreadsheet file inside the locked folder ──
    const timestamp = new Date().toLocaleDateString("en-AU", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
    const sheetTitle = `Invoice Report - ${rootFolderName} - ${timestamp}`;

    const fileResponse = await drive.files.create({
      requestBody: {
        name: sheetTitle,
        mimeType: "application/vnd.google-apps.spreadsheet",
        parents: [lockedFolderId],
      },
      fields: "id, webViewLink",
    });

    const spreadsheetId = fileResponse.data.id!;
    const spreadsheetUrl = fileResponse.data.webViewLink!;

    // ── Step 2: Get the default sheet ID ──
    const spreadsheet = await sheets.spreadsheets.get({
      spreadsheetId,
    });
    const sheetId = spreadsheet.data.sheets?.[0]?.properties?.sheetId || 0;

    // ── Step 3: Rename the sheet ──
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: [
          {
            updateSheetProperties: {
              properties: { sheetId, title: "Invoice Report" },
              fields: "title",
            },
          },
        ],
      },
    });

    // ── Step 4: Prepare data rows ──
    const headerRow = [
      "Folder Path",
      "File Name",
      "Company",
      "Invoice #",
      "Date",
      "Subtotal ($)",
      "Tax %",
      "Tax Amount ($)",
      "Total ($)",
      "Invoice Image",
      "Drive Link",
    ];

    const dataRows = invoices.map((inv) => {
      // Create the image/link combo for Invoice Image column
      let imageLink = "";
      if (inv.webViewLink) {
        if (inv.thumbnailLink) {
          // =HYPERLINK("...", IMAGE("...", 1)) gives a clickable thumbnail!
          imageLink = `=HYPERLINK("${inv.webViewLink}", IMAGE("${inv.thumbnailLink}", 1))`;
        } else {
          imageLink = `=HYPERLINK("${inv.webViewLink}", "👁️ View Image 🔗")`;
        }
      }

      return [
        inv.folderPath || "",
        inv.name || inv.fileName || "",
        inv.company || "",
        inv.invoiceNumber || "",
        inv.date || (inv.modifiedTime
          ? new Date(inv.modifiedTime).toLocaleDateString("en-AU", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })
          : ""),
        inv.subtotal != null ? inv.subtotal : (inv.extractedAmount != null ? inv.extractedAmount : ""),
        inv.taxPercent != null ? (inv.taxPercent / 100) : "",
        inv.taxAmount != null ? inv.taxAmount : "",
        inv.total != null ? inv.total : (inv.extractedAmount != null ? inv.extractedAmount : ""),
        imageLink,
        inv.webViewLink || "",
      ];
    });

    // Total row calculation
    const totalSubtotal = invoices.reduce(
      (sum, inv) => sum + (inv.subtotal != null ? inv.subtotal : (inv.extractedAmount || 0)),
      0
    );
    const totalTaxAmount = invoices.reduce(
      (sum, inv) => sum + (inv.taxAmount || 0),
      0
    );
    const totalAmount = invoices.reduce(
      (sum, inv) => sum + (inv.total != null ? inv.total : (inv.extractedAmount || 0)),
      0
    );

    const totalRow = [
      "",
      "TOTAL",
      "",
      "",
      "",
      totalSubtotal,
      "",
      totalTaxAmount,
      totalAmount,
      "",
      "",
    ];

    // ── Step 5: Write all data ──
    const allRows = [
      [`Files and Folders in Google Drive folder`], // Row 1: Title
      [], // Row 2: Blank
      headerRow, // Row 3: Headers
      ...dataRows, // Row 4+: Data
      [], // Blank separator
      totalRow, // Total row
    ];

    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: "Invoice Report!A1",
      valueInputOption: "USER_ENTERED",
      requestBody: { values: allRows },
    });

    // ── Step 6: Apply formatting ──
    const totalRowIndex = 3 + dataRows.length + 1; // 0-indexed

    const formatRequests = [
      // Title row: merge across all 11 columns, bold, dark bg, white text, large font
      {
        mergeCells: {
          range: { sheetId, startRowIndex: 0, endRowIndex: 1, startColumnIndex: 0, endColumnIndex: 11 },
          mergeType: "MERGE_ALL",
        },
      },
      {
        repeatCell: {
          range: { sheetId, startRowIndex: 0, endRowIndex: 1, startColumnIndex: 0, endColumnIndex: 11 },
          cell: {
            userEnteredFormat: {
              backgroundColor: { red: 0.04, green: 0.05, blue: 0.11 }, // Deep midnight
              textFormat: { fontFamily: "Montserrat", bold: true, fontSize: 16, foregroundColor: { red: 1, green: 1, blue: 1 } },
              horizontalAlignment: "LEFT",
              verticalAlignment: "MIDDLE",
              padding: { top: 16, bottom: 16, left: 16 },
            },
          },
          fields: "userEnteredFormat(backgroundColor,textFormat,horizontalAlignment,verticalAlignment,padding)",
        },
      },
      // Header row (row 3): bold, vibrant indigo bg, white text
      {
        repeatCell: {
          range: { sheetId, startRowIndex: 2, endRowIndex: 3, startColumnIndex: 0, endColumnIndex: 11 },
          cell: {
            userEnteredFormat: {
              backgroundColor: { red: 0.42, green: 0.38, blue: 1.0 }, // #6C63FF match
              textFormat: { fontFamily: "Montserrat", bold: true, fontSize: 11, foregroundColor: { red: 1, green: 1, blue: 1 } },
              horizontalAlignment: "LEFT",
              verticalAlignment: "MIDDLE",
              padding: { top: 12, bottom: 12, left: 12 },
            },
          },
          fields: "userEnteredFormat(backgroundColor,textFormat,horizontalAlignment,verticalAlignment,padding)",
        },
      },
      // Data rows: light alternating background with text wrapping and vertical alignment
      ...dataRows.map((_, i) => ({
        repeatCell: {
          range: {
            sheetId,
            startRowIndex: 3 + i,
            endRowIndex: 4 + i,
            startColumnIndex: 0,
            endColumnIndex: 11,
          },
          cell: {
            userEnteredFormat: {
              backgroundColor:
                i % 2 === 0
                  ? { red: 0.98, green: 0.98, blue: 0.99 } // Ultra light indigo
                  : { red: 1, green: 1, blue: 1 },
              textFormat: { fontFamily: "Montserrat", fontSize: 10, foregroundColor: { red: 0.2, green: 0.25, blue: 0.35 } },
              padding: { top: 10, bottom: 10, left: 12, right: 12 },
              wrapStrategy: "WRAP",
              verticalAlignment: "MIDDLE",
            },
          },
          fields: "userEnteredFormat(backgroundColor,textFormat,padding,wrapStrategy,verticalAlignment)",
        },
      })),
      // Total row: bold, light mint green bg
      {
        repeatCell: {
          range: {
            sheetId,
            startRowIndex: totalRowIndex,
            endRowIndex: totalRowIndex + 1,
            startColumnIndex: 0,
            endColumnIndex: 11,
          },
          cell: {
            userEnteredFormat: {
              backgroundColor: { red: 0.88, green: 0.98, blue: 0.94 }, // Soft mint
              textFormat: { fontFamily: "Montserrat", bold: true, fontSize: 12, foregroundColor: { red: 0.0, green: 0.5, blue: 0.35 } },
              padding: { top: 14, bottom: 14, left: 12 },
              verticalAlignment: "MIDDLE",
            },
          },
          fields: "userEnteredFormat(backgroundColor,textFormat,padding,verticalAlignment)",
        },
      },
      // Currency formatting for numeric columns
      // Subtotal (Col F / ColIndex 5), Tax Amount (Col H / ColIndex 7), Total (Col I / ColIndex 8)
      {
        repeatCell: {
          range: {
            sheetId,
            startRowIndex: 3,
            endRowIndex: totalRowIndex + 1,
            startColumnIndex: 5,
            endColumnIndex: 6,
          },
          cell: {
            userEnteredFormat: {
              numberFormat: { type: "CURRENCY", pattern: "$#,##0.00" },
              horizontalAlignment: "RIGHT",
            },
          },
          fields: "userEnteredFormat(numberFormat,horizontalAlignment)",
        },
      },
      {
        repeatCell: {
          range: {
            sheetId,
            startRowIndex: 3,
            endRowIndex: totalRowIndex + 1,
            startColumnIndex: 7,
            endColumnIndex: 9,
          },
          cell: {
            userEnteredFormat: {
              numberFormat: { type: "CURRENCY", pattern: "$#,##0.00" },
              horizontalAlignment: "RIGHT",
            },
          },
          fields: "userEnteredFormat(numberFormat,horizontalAlignment)",
        },
      },
      // Tax Percent formatting (Col G / ColIndex 6)
      {
        repeatCell: {
          range: {
            sheetId,
            startRowIndex: 3,
            endRowIndex: totalRowIndex + 1,
            startColumnIndex: 6,
            endColumnIndex: 7,
          },
          cell: {
            userEnteredFormat: {
              numberFormat: { type: "NUMBER", pattern: "0.0'%'" },
              horizontalAlignment: "RIGHT",
            },
          },
          fields: "userEnteredFormat(numberFormat,horizontalAlignment)",
        },
      },
      // Freeze header row & Hide Gridlines
      {
        updateSheetProperties: {
          properties: {
            sheetId,
            gridProperties: { frozenRowCount: 3, hideGridlines: true },
          },
          fields: "gridProperties.frozenRowCount,gridProperties.hideGridlines",
        },
      },
      // Set Row Heights
      {
        updateDimensionProperties: {
          range: { sheetId, dimension: "ROWS", startIndex: 3, endIndex: totalRowIndex },
          properties: { pixelSize: 85 }, // Large enough for stunning invoice image thumbnails
          fields: "pixelSize",
        },
      },
      {
        updateDimensionProperties: {
          range: { sheetId, dimension: "ROWS", startIndex: totalRowIndex, endIndex: totalRowIndex + 1 },
          properties: { pixelSize: 50 }, // Total row height
          fields: "pixelSize",
        },
      },
      // Set Column widths
      {
        updateDimensionProperties: {
          range: { sheetId, dimension: "COLUMNS", startIndex: 0, endIndex: 1 },
          properties: { pixelSize: 320 },
          fields: "pixelSize",
        },
      },
      {
        updateDimensionProperties: {
          range: { sheetId, dimension: "COLUMNS", startIndex: 1, endIndex: 2 },
          properties: { pixelSize: 320 },
          fields: "pixelSize",
        },
      },
      {
        updateDimensionProperties: {
          range: { sheetId, dimension: "COLUMNS", startIndex: 2, endIndex: 3 },
          properties: { pixelSize: 200 },
          fields: "pixelSize",
        },
      },
      {
        updateDimensionProperties: {
          range: { sheetId, dimension: "COLUMNS", startIndex: 3, endIndex: 4 },
          properties: { pixelSize: 120 },
          fields: "pixelSize",
        },
      },
      {
        updateDimensionProperties: {
          range: { sheetId, dimension: "COLUMNS", startIndex: 4, endIndex: 5 },
          properties: { pixelSize: 120 },
          fields: "pixelSize",
        },
      },
      {
        updateDimensionProperties: {
          range: { sheetId, dimension: "COLUMNS", startIndex: 5, endIndex: 9 },
          properties: { pixelSize: 130 },
          fields: "pixelSize",
        },
      },
      {
        updateDimensionProperties: {
          range: { sheetId, dimension: "COLUMNS", startIndex: 9, endIndex: 10 },
          properties: { pixelSize: 200 }, // Invoice Image clickable link column width
          fields: "pixelSize",
        },
      },
      {
        updateDimensionProperties: {
          range: { sheetId, dimension: "COLUMNS", startIndex: 10, endIndex: 11 },
          properties: { pixelSize: 300 },
          fields: "pixelSize",
        },
      },
      // Modern borders: Only subtle horizontal dividers (No vertical borders for SaaS look)
      {
        updateBorders: {
          range: {
            sheetId,
            startRowIndex: 2,
            endRowIndex: totalRowIndex + 1,
            startColumnIndex: 0,
            endColumnIndex: 11,
          },
          top: { style: "SOLID", color: { red: 0.42, green: 0.38, blue: 1.0 } },
          bottom: { style: "SOLID_MEDIUM", color: { red: 0.85, green: 0.85, blue: 0.9 } },
          innerHorizontal: { style: "SOLID", color: { red: 0.92, green: 0.92, blue: 0.95 } },
        },
      },
    ];


    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: { requests: formatRequests },
    });

    return NextResponse.json({
      success: true,
      spreadsheetId,
      spreadsheetUrl,
      title: sheetTitle,
      rowsWritten: dataRows.length,
    });
  } catch (error: unknown) {
    console.error("Export sheet error:", error);
    const message =
      (error as { message?: string })?.message || "Failed to create spreadsheet";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
