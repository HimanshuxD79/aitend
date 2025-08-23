import { inngest } from "@/inngest/client";
import { StreamTranscriptItem } from "@/modules/meetings/types";
import { eq, inArray } from "drizzle-orm";
import { user, agents, meetings } from "@/db/schema";
import { db } from "@/db";
import JSONL from "jsonl-parse-stringify";
import { createAgent, openai } from "@inngest/agent-kit";

const summarizer = createAgent({
  name: "summarizer",
  system: `
  You are an expert summarizer. You write readable, concise, simple content. You are given a transcript of a meeting and you need to summarize it.

Use the following markdown structure for every output:

### Overview
Provide a detailed, engaging summary of the session's content. Focus on major features, user workflows, and any key takeaways. Write in a narrative style, using full sentences. Highlight unique or powerful aspects of the product, platform, or discussion.

### Notes
Break down key content into thematic sections with timestamp ranges. Each section should summarize key points, actions, or demos in bullet format.

Example:
#### Section Name
- Main point or demo shown here
- Another key insight or interaction
- Follow-up tool or explanation provided

#### Next Section
- Feature X automatically does Y
- Mention of integration with Z
  `.trim(),
  model: openai({ model: "gpt-4o", apiKey: process.env.OPENAI_API_KEY! }),
});

// Function to complete meetings that might not have transcripts
export const meetingsComplete = inngest.createFunction(
  { id: "meetings-complete" },
  { event: "meetings/complete" },
  async ({ event, step }) => {
    console.log("Completing meeting without transcript:", event.data.meetingId);

    await step.run("mark-completed", async () => {
      // Only complete if still in processing state
      const [existingMeeting] = await db
        .select()
        .from(meetings)
        .where(eq(meetings.id, event.data.meetingId));

      if (existingMeeting && existingMeeting.status === "processing") {
        // Check if this was a very short meeting
        const duration =
          existingMeeting.endedAt && existingMeeting.startedAt
            ? Math.floor(
                (new Date(existingMeeting.endedAt).getTime() -
                  new Date(existingMeeting.startedAt).getTime()) /
                  1000
              )
            : 0;

        let summaryMessage = "Meeting completed successfully.";
        if (duration < 60) {
          summaryMessage =
            "Meeting was very brief (less than 1 minute). Transcript may not be available for short meetings.";
        } else {
          summaryMessage =
            "Meeting completed. Transcript processing took longer than expected or was not available.";
        }

        await db
          .update(meetings)
          .set({
            status: "completed",
            summary: summaryMessage,
          })
          .where(eq(meetings.id, event.data.meetingId));
        console.log(
          "Meeting marked as completed (fallback):",
          event.data.meetingId
        );
      } else {
        console.log(
          "Meeting already processed or not found:",
          event.data.meetingId
        );
      }
    });

    return { completed: true };
  }
);
export const meetingsProcessing = inngest.createFunction(
  { id: "meetings-processing" },
  { event: "meetings/processing" },
  async ({ event, step }) => {
    console.log("Processing meeting:", event.data.meetingId);

    const response = await step.run("fetch-transcript", async () => {
      console.log("Fetching transcript from:", event.data.transcriptUrl);
      return fetch(event.data.transcriptUrl).then((res) => res.text());
    });

    const transcript = await step.run("parse-transcript", async () => {
      return JSONL.parse<StreamTranscriptItem>(response);
    });

    const transcriptWithSpeakers = await step.run("add-speaker", async () => {
      const speakerIds = [
        ...new Set(transcript.map((item) => item.speaker_id)),
      ];
      const userSpeakers = await db
        .select()
        .from(user)
        .where(inArray(user.id, speakerIds))
        .then((users) =>
          users.map((user) => ({
            ...user,
          }))
        );
      const agentSpeakers = await db
        .select()
        .from(agents)
        .where(inArray(agents.id, speakerIds))
        .then((agents) =>
          agents.map((agent) => ({
            ...agent,
          }))
        );
      const speakers = [...userSpeakers, ...agentSpeakers];
      return transcript.map((item) => {
        const speaker = speakers.find(
          (speaker) => speaker.id === item.speaker_id
        );
        if (!speaker) {
          return {
            ...item,
            user: {
              name: "Unknown",
            },
          };
        }
        return {
          ...item,
          user: {
            name: speaker.name,
          },
        };
      });
    });

    const { output } = await summarizer.run(
      "Summary the flowing transcript: " +
        JSON.stringify(transcriptWithSpeakers)
    );

    await step.run("save-summary", async () => {
      console.log("Saving summary for meeting:", event.data.meetingId);
      const summaryText =
        output[0] && "content" in output[0]
          ? String(output[0].content)
          : "Summary not available";
      await db
        .update(meetings)
        .set({
          summary: summaryText,
          status: "completed",
        })
        .where(eq(meetings.id, event.data.meetingId));
    });

    return output;
  }
);
