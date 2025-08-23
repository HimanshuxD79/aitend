import { and, eq, not } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import {
  CallEndedEvent,
  CallRecordingReadyEvent,
  CallSessionParticipantLeftEvent,
  CallSessionStartedEvent,
  CallTranscriptionReadyEvent,
} from "@stream-io/node-sdk";
import { db } from "@/db";
import { agents, meetings } from "@/db/schema";
import { streamVideo } from "@/lib/stream-video";
import { inngest } from "@/inngest/client";

function verifySignatureWithSDK(body: string, signature: string): boolean {
  return streamVideo.verifyWebhook(body, signature);
}
export async function POST(req: NextRequest) {
  console.log("=== WEBHOOK RECEIVED ===");
  console.log("Method:", req.method);
  console.log("URL:", req.url);
  console.log("Timestamp:", new Date().toISOString());

  const signature = req.headers.get("x-signature");
  const apiKey = req.headers.get("x-api-key");
  const userAgent = req.headers.get("user-agent");

  console.log("Headers:", {
    signature: !!signature,
    apiKey: !!apiKey,
    userAgent,
  });

  if (!signature || !apiKey) {
    console.error("Missing signature or API key");
    return NextResponse.json(
      { error: "Missing signature or API key" },
      { status: 400 }
    );
  }
  const bodyText = await req.text();

  if (!verifySignatureWithSDK(bodyText, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let payload: unknown;
  try {
    payload = JSON.parse(bodyText) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const eventType = (payload as Record<string, unknown>)?.type;
  console.log("=== EVENT DETAILS ===");
  console.log("Event Type:", eventType);
  console.log("Full Payload:", JSON.stringify(payload, null, 2));

  if (eventType === "call.session_started") {
    console.log("Received call.session_started event");
    const event = payload as CallSessionStartedEvent;
    // Handle both old and new field names for backward compatibility
    const meetingId =
      event.call.custom?.meetingId || event.call.custom?.meetingsId;
    console.log("Meeting ID from webhook:", meetingId);
    console.log("Full custom data:", event.call.custom);

    if (!meetingId) {
      console.error("Missing meeting ID in webhook");
      return NextResponse.json(
        { error: "Missing meeting ID" },
        { status: 400 }
      );
    }
    const [existingMeeting] = await db
      .select()
      .from(meetings)
      .where(
        and(
          eq(meetings.id, meetingId),
          not(eq(meetings.status, "completed")),
          not(eq(meetings.status, "active")),
          not(eq(meetings.status, "cancelled")),
          not(eq(meetings.status, "processing"))
        )
      );
    if (!existingMeeting) {
      return NextResponse.json({ error: "Meeting not found" }, { status: 404 });
    }
    await db
      .update(meetings)
      .set({ status: "active", startedAt: new Date() })
      .where(eq(meetings.id, existingMeeting.id));
    const [existingAgent] = await db
      .select()
      .from(agents)
      .where(eq(agents.id, existingMeeting.agentId));
    if (!existingAgent) {
      console.error("Agent not found for meeting:", meetingId);
      return NextResponse.json({ error: "Agent not found" }, { status: 404 });
    }

    console.log("Connecting agent to call:", existingAgent.id);
    console.log("OpenAI API Key available:", !!process.env.OPENAI_API_KEY);

    try {
      const call = streamVideo.video.call("default", meetingId);
      const realtimeClient = await streamVideo.video.connectOpenAi({
        call,
        openAiApiKey: process.env.OPENAI_API_KEY!,
        agentUserId: existingAgent.id,
      });

      realtimeClient.updateSession({
        instructions: existingAgent.instructions,
      });

      console.log("Agent successfully connected to call");
    } catch (error) {
      console.error("Failed to connect agent to call:", error);
      return NextResponse.json(
        { error: "Failed to connect agent" },
        { status: 500 }
      );
    }
  } else if (eventType === "call.session_participant_left") {
    console.log("Received call.session_participant_left event");
    const event = payload as CallSessionParticipantLeftEvent;
    const meetingId = event.call_cid.split(":")[1];
    console.log("Meeting ID from participant left:", meetingId);

    if (!meetingId) {
      console.error("Missing meeting ID in participant left event");
      return NextResponse.json(
        { error: "Missing meeting ID" },
        { status: 400 }
      );
    }

    // Check if this was the last real participant (not agent/recording bots)
    try {
      // End the call which will trigger call.session_ended
      const call = streamVideo.video.call("default", meetingId);
      await call.end();
      console.log("Call ended successfully");

      // Also immediately update meeting status to processing
      console.log(
        "Updating meeting status to processing after participant left"
      );
      const [updatedMeeting] = await db
        .update(meetings)
        .set({
          status: "processing",
          endedAt: new Date(),
        })
        .where(eq(meetings.id, meetingId))
        .returning();

      if (updatedMeeting) {
        console.log("Meeting status updated to processing:", meetingId);

        // Schedule a fallback completion in case transcription doesn't arrive
        // For very short meetings, transcription might not be available
        try {
          // Wait a bit longer for transcription, but not too long
          setTimeout(async () => {
            try {
              console.log(
                "Triggering fallback completion after 30 seconds for meeting:",
                meetingId
              );
              await inngest.send({
                name: "meetings/complete",
                data: {
                  meetingId: meetingId,
                },
              });
              console.log(
                "Delayed fallback completion triggered for meeting:",
                meetingId
              );
            } catch (error) {
              console.error(
                "Failed to trigger delayed fallback completion:",
                error
              );
            }
          }, 30000); // Wait 30 seconds for transcription
        } catch (error) {
          console.error("Failed to schedule fallback completion:", error);
        }
      }
    } catch (error) {
      console.error("Failed to end call or update meeting:", error);
    }
  } else if (eventType === "call.session_ended") {
    console.log("Received call.session_ended event");
    const event = payload as CallEndedEvent;
    // Handle both old and new field names for backward compatibility
    const meetingId =
      event.call.custom?.meetingId || event.call.custom?.meetingsId;
    console.log("Meeting ID from session ended:", meetingId);

    if (!meetingId) {
      console.error("Missing meeting ID in session ended event");
      return NextResponse.json(
        { error: "Missing meeting ID" },
        { status: 400 }
      );
    }

    console.log("Updating meeting status to processing for:", meetingId);
    try {
      const [updatedMeeting] = await db
        .update(meetings)
        .set({
          status: "processing",
          endedAt: new Date(),
        })
        .where(eq(meetings.id, meetingId))
        .returning();

      if (updatedMeeting) {
        console.log("Meeting status updated to processing:", meetingId);
      } else {
        console.log("No meeting found to update:", meetingId);
      }
    } catch (error) {
      console.error("Failed to update meeting status:", error);
    }
  } else if (eventType === "call.ended") {
    console.log("Received call.ended event");
    const event = payload as Record<string, unknown>; // Handle generic call ended event
    const callObj = event.call as Record<string, unknown>;
    const customObj = callObj?.custom as Record<string, unknown>;
    const meetingId = event.call_cid
      ? String(event.call_cid).split(":")[1]
      : customObj?.meetingId || customObj?.meetingsId;
    console.log("Meeting ID from call ended:", meetingId);

    if (meetingId) {
      console.log("Updating meeting status to processing for:", meetingId);
      try {
        const [updatedMeeting] = await db
          .update(meetings)
          .set({
            status: "processing",
            endedAt: new Date(),
          })
          .where(eq(meetings.id, String(meetingId)))
          .returning();

        if (updatedMeeting) {
          console.log("Meeting status updated to processing:", meetingId);
        }
      } catch (error) {
        console.error("Failed to update meeting status:", error);
      }
    }
  } else if (eventType === "call.transcription_ready") {
    console.log("🎉 Received call_transcription_ready event");
    const event = payload as CallTranscriptionReadyEvent;
    const meetingId = event.call_cid.split(":")[1];
    console.log("📝 Processing transcription for meeting:", meetingId);
    console.log("📄 Transcript URL:", event.call_transcription.url);

    const [updatedMeeting] = await db
      .update(meetings)
      .set({
        transcriptUrl: event.call_transcription.url,
        status: "processing",
      })
      .where(eq(meetings.id, meetingId))
      .returning();

    if (!updatedMeeting) {
      console.error("❌ Meeting not found for transcription:", meetingId);
      return NextResponse.json({ error: "Meeting not found" }, { status: 404 });
    }

    // Trigger Inngest function to process the transcript
    try {
      await inngest.send({
        name: "meetings/processing",
        data: {
          meetingId: meetingId,
          transcriptUrl: event.call_transcription.url,
        },
      });
      console.log(
        "✅ Inngest processing function triggered for meeting:",
        meetingId
      );
    } catch (error) {
      console.error("❌ Failed to trigger Inngest function:", error);
    }
  } else if (eventType === "call.recording_ready") {
    console.log("🎥 Received call.recording_ready event");
    const event = payload as CallRecordingReadyEvent;
    const meetingId = event.call_cid.split(":")[1];
    console.log("📹 Processing recording for meeting:", meetingId);
    console.log(
      "📄 Full recording event payload:",
      JSON.stringify(event, null, 2)
    );

    // Update with recording URL
    const [updatedMeeting] = await db
      .update(meetings)
      .set({
        recordingUrl: event.call_recording.url,
      })
      .where(eq(meetings.id, meetingId))
      .returning();

    if (!updatedMeeting) {
      console.error("❌ Meeting not found for recording:", meetingId);
      return NextResponse.json({ error: "Meeting not found" }, { status: 404 });
    }

    console.log("✅ Recording URL saved for meeting:", meetingId);

    // Check if the recording event also contains transcript data
    const recordingData = event.call_recording as unknown as Record<
      string,
      unknown
    >;
    if (recordingData.transcript_url || recordingData.transcription_url) {
      const transcriptUrl = String(
        recordingData.transcript_url || recordingData.transcription_url
      );
      console.log("📝 Found transcript URL in recording event:", transcriptUrl);

      // Update with transcript URL and trigger processing
      await db
        .update(meetings)
        .set({
          transcriptUrl: transcriptUrl,
          status: "processing",
        })
        .where(eq(meetings.id, meetingId));

      // Trigger Inngest function to process the transcript
      try {
        await inngest.send({
          name: "meetings/processing",
          data: {
            meetingId: meetingId,
            transcriptUrl: transcriptUrl,
          },
        });
        console.log(
          "✅ Inngest transcript processing triggered for meeting:",
          meetingId
        );
      } catch (error) {
        console.error(
          "❌ Failed to trigger Inngest transcript processing:",
          error
        );
      }
    } else {
      console.log("⚠️ No transcript URL found in recording event");

      // Alternative: Try to get transcript from Stream Video API after recording is ready
      try {
        console.log("🔍 Checking Stream Video API for transcript...");
        const call = streamVideo.video.call("default", meetingId);
        const callDetails = await call.get();

        console.log("📋 Call details:", JSON.stringify(callDetails, null, 2));

        // Check if transcript is available in call details
        // Note: This might be available in call.recording or call.transcription
        const callData = callDetails as unknown as Record<string, unknown>;
        const callObject = callData?.call as Record<string, unknown>;
        const recordingObj = callObject?.recording as Record<string, unknown>;
        const transcriptionObj = callObject?.transcription as Record<
          string,
          unknown
        >;
        const transcriptsArray = callObject?.transcripts as unknown[];

        const transcript =
          recordingObj?.transcript_url ||
          transcriptionObj?.url ||
          (transcriptsArray?.[0] as Record<string, unknown>)?.url;

        if (transcript) {
          console.log("📝 Found transcript URL from API:", transcript);

          // Update with transcript URL and trigger processing
          await db
            .update(meetings)
            .set({
              transcriptUrl: String(transcript),
              status: "processing",
            })
            .where(eq(meetings.id, meetingId));

          // Trigger Inngest function to process the transcript
          try {
            await inngest.send({
              name: "meetings/processing",
              data: {
                meetingId: meetingId,
                transcriptUrl: String(transcript),
              },
            });
            console.log(
              "✅ Inngest transcript processing triggered from API for meeting:",
              meetingId
            );
          } catch (error) {
            console.error(
              "❌ Failed to trigger Inngest transcript processing from API:",
              error
            );
          }
        } else {
          console.log("⚠️ No transcript found in Stream Video API either");

          // Schedule a delayed check for transcript (Stream Video might need time to process)
          setTimeout(async () => {
            try {
              console.log(
                "🔄 Delayed transcript check for meeting:",
                meetingId
              );
              const delayedCall = streamVideo.video.call("default", meetingId);
              const delayedCallDetails = await delayedCall.get();

              const delayedCallData = delayedCallDetails as unknown as Record<
                string,
                unknown
              >;
              const delayedCallObject = delayedCallData?.call as Record<
                string,
                unknown
              >;
              const delayedRecordingObj =
                delayedCallObject?.recording as Record<string, unknown>;
              const delayedTranscriptionObj =
                delayedCallObject?.transcription as Record<string, unknown>;
              const delayedTranscriptsArray =
                delayedCallObject?.transcripts as unknown[];

              const delayedTranscript =
                delayedRecordingObj?.transcript_url ||
                delayedTranscriptionObj?.url ||
                (delayedTranscriptsArray?.[0] as Record<string, unknown>)?.url;

              if (delayedTranscript) {
                console.log(
                  "📝 Found transcript URL from delayed API check:",
                  delayedTranscript
                );

                await db
                  .update(meetings)
                  .set({
                    transcriptUrl: String(delayedTranscript),
                    status: "processing",
                  })
                  .where(eq(meetings.id, meetingId));

                await inngest.send({
                  name: "meetings/processing",
                  data: {
                    meetingId: meetingId,
                    transcriptUrl: String(delayedTranscript),
                  },
                });
                console.log(
                  "✅ Delayed transcript processing triggered for meeting:",
                  meetingId
                );
              } else {
                console.log(
                  "⚠️ Still no transcript available after delay for meeting:",
                  meetingId
                );
              }
            } catch (error) {
              console.error("❌ Failed delayed transcript check:", error);
            }
          }, 60000); // Wait 1 minute for transcript to be generated
        }
      } catch (error) {
        console.error(
          "❌ Failed to fetch call details from Stream Video API:",
          error
        );
      }
    }
  }
  return NextResponse.json({ status: "ok" });
}
