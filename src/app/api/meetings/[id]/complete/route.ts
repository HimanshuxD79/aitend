import { NextRequest, NextResponse } from "next/server";
import { inngest } from "@/inngest/client";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: meetingId } = await params;

    console.log("Manual completion triggered for meeting:", meetingId);

    // Trigger the completion function
    await inngest.send({
      name: "meetings/complete",
      data: {
        meetingId: meetingId,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Meeting completion triggered",
    });
  } catch (error) {
    console.error("Failed to trigger meeting completion:", error);
    return NextResponse.json(
      { error: "Failed to trigger completion" },
      { status: 500 }
    );
  }
}
