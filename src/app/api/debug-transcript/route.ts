import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { meetings } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(req: NextRequest) {
  try {
    const { meetingId, transcript } = await req.json();

    if (!meetingId) {
      return NextResponse.json({ error: "Missing meetingId" }, { status: 400 });
    }

    const testTranscript =
      transcript ||
      `[10:30:15] User: Hello, can you hear me?
[10:30:18] AI Agent: Yes, I can hear you clearly. How can I help you today?
[10:30:25] User: I wanted to test the transcript functionality.
[10:30:30] AI Agent: Great! This transcript should now appear in your meeting summary.
[10:30:35] User: Perfect, thank you for the demo.
[10:30:40] AI Agent: You're welcome! Is there anything else you'd like to know?`;

    // Update meeting with test transcript
    const [updatedMeeting] = await db
      .update(meetings)
      .set({
        transcript: testTranscript,
        transcriptUrl: "https://example.com/test-transcript.jsonl",
        status: "completed",
        summary:
          "This was a test meeting to verify transcript functionality. The user tested the system and confirmed it was working properly.",
      })
      .where(eq(meetings.id, meetingId))
      .returning();

    if (!updatedMeeting) {
      return NextResponse.json({ error: "Meeting not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: "Test transcript added",
      meeting: updatedMeeting,
    });
  } catch (error) {
    console.error("Failed to add test transcript:", error);
    return NextResponse.json(
      { error: "Failed to add test transcript" },
      { status: 500 }
    );
  }
}
