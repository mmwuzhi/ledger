import { NextRequest, NextResponse } from 'next/server';

export interface OcrResult {
  amount: number | null;
  note: string;
  date: string | null; // YYYY-MM-DD or null
}

// Strips markdown code fences and returns the raw JSON string
function stripFences(s: string): string {
  return s.replace(/```(?:json)?\n?/g, '').trim();
}

/**
 * POST /api/ocr
 * Body: { image: string }  — full base64 data URL ("data:image/jpeg;base64,...")
 * Returns: OcrResult
 *
 * Uses Gemini 1.5 Flash free tier (15 RPM / 1 M tokens per day).
 * Set GEMINI_API_KEY in .env.local to enable.
 */
export async function POST(req: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: 'GEMINI_API_KEY is not configured. Add it to .env.local.' },
      { status: 503 }
    );
  }

  const { image } = await req.json();
  if (!image || typeof image !== 'string') {
    return NextResponse.json({ error: 'Missing image field' }, { status: 400 });
  }

  // Strip the data URL prefix to get raw base64
  const base64 = image.replace(/^data:image\/\w+;base64,/, '');
  // Derive mime type from prefix, default to jpeg
  const mimeMatch = image.match(/^data:(image\/\w+);base64,/);
  const mimeType = mimeMatch?.[1] ?? 'image/jpeg';

  const prompt = `You are a receipt / expense document parser.
Extract from the image:
- amount: the total amount as a number (decimal, no currency symbol). Null if not found.
- note: a short description (≤30 chars) of what was purchased, in the same language as the receipt. Empty string if unclear.
- date: the transaction date in YYYY-MM-DD format. Null if not visible.

Respond with ONLY valid JSON, no explanation:
{"amount": number|null, "note": string, "date": string|null}`;

  const geminiRes = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: prompt },
              { inline_data: { mime_type: mimeType, data: base64 } },
            ],
          },
        ],
        generationConfig: { temperature: 0, maxOutputTokens: 256 },
      }),
    }
  );

  if (!geminiRes.ok) {
    const err = await geminiRes.text();
    return NextResponse.json({ error: 'Gemini API error', detail: err }, { status: 502 });
  }

  const geminiData = await geminiRes.json();
  const rawText: string =
    geminiData?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';

  try {
    const parsed: OcrResult = JSON.parse(stripFences(rawText));
    return NextResponse.json(parsed);
  } catch {
    return NextResponse.json(
      { error: 'Failed to parse Gemini response', raw: rawText },
      { status: 422 }
    );
  }
}
