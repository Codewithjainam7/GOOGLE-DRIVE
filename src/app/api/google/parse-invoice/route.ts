import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import { createAuthedClient } from "@/lib/google";
import { getSession } from "@/lib/session";

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = "meta-llama/llama-4-scout-17b-16e-instruct";

/**
 * POST /api/google/parse-invoice
 * Downloads a file's thumbnail from Google Drive, sends it to Groq Vision API
 * for structured invoice data extraction.
 *
 * Body: { fileId: string }
 * Returns: { parsed: ParsedInvoiceData }
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const groqApiKey = process.env.GROQ_API_KEY;
    if (!groqApiKey) {
      return NextResponse.json(
        { error: "GROQ_API_KEY not configured in environment variables." },
        { status: 500 }
      );
    }

    const body = await request.json();
    const fileId = body.fileId;
    if (!fileId) {
      return NextResponse.json({ error: "fileId is required" }, { status: 400 });
    }

    const client = createAuthedClient({
      access_token: session.access_token,
      refresh_token: session.refresh_token,
    });

    const drive = google.drive({ version: "v3", auth: client });

    // Step 1: Get file metadata including thumbnail
    const fileMeta = await drive.files.get({
      fileId,
      fields: "name, mimeType, thumbnailLink",
    });

    let thumbnailUrl = fileMeta.data.thumbnailLink;
    if (!thumbnailUrl) {
      return NextResponse.json(
        { error: "No thumbnail available for this file." },
        { status: 404 }
      );
    }

    // Request higher resolution for better OCR
    thumbnailUrl = thumbnailUrl.replace(/=s\d+$/, "=s1600");

    // Step 2: Fetch thumbnail image
    const token = (await client.getAccessToken()).token;
    const imageRes = await fetch(thumbnailUrl, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!imageRes.ok) {
      return NextResponse.json(
        { error: "Failed to download file thumbnail." },
        { status: 502 }
      );
    }

    const imageBuffer = await imageRes.arrayBuffer();
    const base64Image = Buffer.from(imageBuffer).toString("base64");
    const contentType = imageRes.headers.get("content-type") || "image/png";

    // Check size — Groq allows max 4MB base64
    if (base64Image.length > 4 * 1024 * 1024) {
      return NextResponse.json(
        { error: "Image too large for AI processing (max 4MB)." },
        { status: 413 }
      );
    }

    // Step 3: Send to Groq Vision API
    const groqResponse = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${groqApiKey}`,
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Analyze this invoice/bill/receipt image and extract the following data. Return ONLY a valid JSON object with no additional text, no markdown formatting, no code blocks.

{
  "invoiceNumber": "string or null",
  "date": "string or null (format: DD MMM YYYY)",
  "dueDate": "string or null (format: DD MMM YYYY)",
  "company": "string or null (the company issuing the invoice)",
  "billTo": "string or null (the recipient)",
  "items": [
    {
      "description": "string",
      "quantity": 0,
      "rate": 0,
      "amount": 0
    }
  ],
  "subtotal": 0,
  "taxPercent": 0,
  "taxAmount": 0,
  "total": 0,
  "currency": "string (e.g. AUD, USD)"
}

Important: All monetary values should be numbers (not strings). If you cannot determine a field, set it to null. Return ONLY the JSON object.`,
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:${contentType};base64,${base64Image}`,
                },
              },
            ],
          },
        ],
        temperature: 0.1,
        max_tokens: 1024,
      }),
    });

    if (!groqResponse.ok) {
      const errData = await groqResponse.json().catch(() => ({}));
      console.error("Groq API error:", errData);
      return NextResponse.json(
        {
          error: `Groq API error: ${(errData as { error?: { message?: string } })?.error?.message || groqResponse.statusText}`,
        },
        { status: 502 }
      );
    }

    const groqData = await groqResponse.json();
    const rawContent = groqData.choices?.[0]?.message?.content || "";

    // Step 4: Parse the JSON from Groq's response
    let parsed;
    try {
      // Try to extract JSON from response (handle markdown code blocks if present)
      let jsonStr = rawContent.trim();
      // Remove markdown code block wrappers if present
      if (jsonStr.startsWith("```")) {
        jsonStr = jsonStr.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
      }
      parsed = JSON.parse(jsonStr);
    } catch {
      console.error("Failed to parse Groq response:", rawContent);
      return NextResponse.json(
        { error: "AI returned invalid data. Please try again." },
        { status: 502 }
      );
    }

    return NextResponse.json({
      success: true,
      parsed: {
        invoiceNumber: parsed.invoiceNumber || null,
        date: parsed.date || null,
        dueDate: parsed.dueDate || null,
        company: parsed.company || null,
        billTo: parsed.billTo || null,
        items: Array.isArray(parsed.items) ? parsed.items : [],
        subtotal: typeof parsed.subtotal === "number" ? parsed.subtotal : null,
        taxPercent: typeof parsed.taxPercent === "number" ? parsed.taxPercent : null,
        taxAmount: typeof parsed.taxAmount === "number" ? parsed.taxAmount : null,
        total: typeof parsed.total === "number" ? parsed.total : null,
        currency: parsed.currency || "AUD",
      },
      fileName: fileMeta.data.name,
    });
  } catch (error: unknown) {
    console.error("Parse invoice error:", error);
    return NextResponse.json(
      { error: "Failed to parse invoice" },
      { status: 500 }
    );
  }
}
