import { NextRequest, NextResponse } from "next/server";
import JSONL from "jsonl-parse-stringify";
import { StreamTranscriptItem } from "@/modules/meetings/types";

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");

  if (!url) {
    return NextResponse.json(
      { error: "Missing transcript URL" },
      { status: 400 }
    );
  }

  try {
    console.log("Testing transcript fetch from:", url);

    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; aitend-app)",
      },
    });

    console.log("Response status:", response.status);
    console.log(
      "Response headers:",
      Object.fromEntries(response.headers.entries())
    );

    if (!response.ok) {
      return NextResponse.json(
        {
          error: `Failed to fetch transcript: ${response.status} ${response.statusText}`,
        },
        { status: response.status }
      );
    }

    const text = await response.text();
    console.log("Raw text length:", text.length);
    console.log("Raw text preview:", text.substring(0, 500));

    try {
      const parsed = JSONL.parse<StreamTranscriptItem>(text);
      console.log("Parsed items:", parsed.length);

      return NextResponse.json({
        success: true,
        itemCount: parsed.length,
        preview: parsed.slice(0, 3),
        rawPreview: text.substring(0, 500),
      });
    } catch (parseError) {
      console.error("Parse error:", parseError);
      return NextResponse.json(
        {
          error: "Failed to parse JSONL",
          parseError: String(parseError),
          rawText: text.substring(0, 500),
        },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Fetch error:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch transcript",
        details: String(error),
      },
      { status: 500 }
    );
  }
}
