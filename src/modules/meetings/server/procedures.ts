import { db } from "@/db";
import JSONL from "jsonl-parse-stringify";
import { meetings, agents, user } from "@/db/schema";
import {
  and,
  count,
  desc,
  eq,
  getTableColumns,
  ilike,
  inArray,
  sql,
} from "drizzle-orm";
import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/trpc/init";
import { meetingsInsertSchema } from "../schemas";
import {
  DEFAULT_PAGE,
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
  MIN_PAGE_SIZE,
} from "@/constants";
import { TRPCError } from "@trpc/server";
import { meetingsUpdateSchema } from "../schemas";
import { MeetingStatus, StreamTranscriptItem } from "../types";
import { streamVideo } from "@/lib/stream-video";
import { generateAvatarUri } from "@/lib/avatar";
import { streamChat } from "@/lib/stream-chat";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});
export const meetingsRouter = createTRPCRouter({
  askAI: protectedProcedure
    .input(
      z.object({
        meetingId: z.string(),
        question: z.string().min(1).max(500),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Get meeting data with transcript and summary
      const [meeting] = await db
        .select({
          ...getTableColumns(meetings),
          agents: agents,
          duration:
            sql<number>`EXTRACT(EPOCH FROM (${meetings.endedAt} - ${meetings.startedAt}))`.as(
              "duration"
            ),
        })
        .from(meetings)
        .innerJoin(agents, eq(meetings.agentId, agents.id))
        .where(
          and(
            eq(meetings.id, input.meetingId),
            eq(meetings.userId, ctx.auth.user.id)
          )
        );

      if (!meeting) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Meeting not found",
        });
      }

      // Get transcript data
      let transcriptData = "";
      if (meeting.transcriptUrl) {
        try {
          const response = await fetch(meeting.transcriptUrl);
          if (response.ok) {
            const text = await response.text();
            const transcript = JSONL.parse<StreamTranscriptItem>(text);
            transcriptData = transcript
              .map((item) => `${item.speaker_id}: ${item.text}`)
              .join("\n");
          }
        } catch {
          console.log("Could not fetch transcript for AI analysis");
        }
      }

      // Create AI prompt
      const systemPrompt = `You are an AI meeting coach specialized in providing constructive feedback on meetings and interviews. 
      
Meeting Details:
- Name: ${meeting.name}
- Agent: ${meeting.agents.name}
- Agent Instructions: ${meeting.agents.instructions}
- Summary: ${meeting.summary || "No summary available"}
- Duration: ${
        meeting.duration ? Math.round(meeting.duration / 60) : "Unknown"
      } minutes

${
  transcriptData
    ? `Transcript:\n${transcriptData}`
    : "No transcript available for this meeting."
}

Please provide helpful, specific, and actionable feedback based on the user's question. Focus on:
- Communication skills
- Areas for improvement
- Specific examples from the meeting content
- Constructive suggestions
- Positive reinforcement where appropriate

Be encouraging but honest in your assessment.`;

      try {
        const completion = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: input.question },
          ],
          max_tokens: 500,
          temperature: 0.7,
        });

        return (
          completion.choices[0]?.message?.content ||
          "I couldn't generate a response. Please try again."
        );
      } catch (error) {
        console.error("OpenAI API error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to generate AI response. Please try again.",
        });
      }
    }),

  generateChatToken: protectedProcedure.mutation(async ({ ctx }) => {
    const token = streamChat.createToken(ctx.auth.user.id);
    await streamChat.upsertUsers([
      {
        id: ctx.auth.user.id,
        role: "admin",
      },
    ]);
    return token;
  }),
  getTranscript: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input, ctx }) => {
      const [existingMeeting] = await db
        .select()
        .from(meetings)
        .where(
          and(eq(meetings.id, input.id), eq(meetings.userId, ctx.auth.user.id))
        );
      if (!existingMeeting) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Meeting not found",
        });
      }
      if (!existingMeeting.transcriptUrl) {
        console.log("No transcript URL found for meeting:", input.id);
        return [];
      }

      console.log(
        "Fetching transcript from URL:",
        existingMeeting.transcriptUrl
      );

      let transcript: StreamTranscriptItem[] = [];
      try {
        const response = await fetch(existingMeeting.transcriptUrl, {
          headers: {
            "User-Agent": "Mozilla/5.0 (compatible; aitend-app)",
          },
        });
        console.log("Transcript fetch response status:", response.status);

        if (!response.ok) {
          console.error(
            "Failed to fetch transcript, status:",
            response.status,
            "statusText:",
            response.statusText
          );
          return [];
        }

        const text = await response.text();
        console.log("Transcript text length:", text.length);
        console.log("Transcript text preview:", text.substring(0, 200));

        transcript = JSONL.parse<StreamTranscriptItem>(text);
        console.log("Parsed transcript items:", transcript.length);
      } catch (error) {
        console.error("Error fetching or parsing transcript:", error);
        return [];
      }
      const speakerIds = [
        ...new Set(transcript.map((item) => item.speaker_id)),
      ];
      const userSpeakers = await db
        .select()
        .from(user)
        .where(inArray(user.id, speakerIds))
        .then((users) => {
          return users.map((user) => ({
            ...user,
            image:
              user.image ??
              generateAvatarUri({ seed: user.name, variant: "initials" }),
          }));
        });
      const agentSpeakers = await db
        .select()
        .from(agents)
        .where(inArray(agents.id, speakerIds))
        .then((agents) => {
          return agents.map((agent) => ({
            ...agent,
            image: generateAvatarUri({ seed: agent.name, variant: "initials" }),
          }));
        });
      const speakers = [...userSpeakers, ...agentSpeakers];
      const transcriptWithSpeakers = transcript.map((item) => {
        const speaker = speakers.find((s) => s.id === item.speaker_id);
        if (!speaker) {
          return {
            ...item,
            user: {
              name: "Unknown User",
              image: generateAvatarUri({
                seed: "Unknown User",
                variant: "initials",
              }),
            },
          };
        }
        return {
          ...item,
          user: {
            id: speaker.id,
            name: speaker.name,
            image: speaker.image,
          },
        };
      });
      return transcriptWithSpeakers;
    }),

  generateToken: protectedProcedure.mutation(async ({ ctx }) => {
    await streamVideo.upsertUsers([
      {
        id: ctx.auth.user.id,
        name: ctx.auth.user.name || "Unknown User",
        role: "admin",
        image:
          ctx.auth.user.image ??
          generateAvatarUri({ seed: ctx.auth.user.name, variant: "initials" }),
      },
    ]);
    const expirationTime = Math.floor(Date.now() / 1000) + 60 * 60; // 1 hour
    const issuedAt = Math.floor(Date.now() / 1000) - 60;
    const token = streamVideo.generateUserToken({
      user_id: ctx.auth.user.id,
      exp: expirationTime,
      validity_in_seconds: issuedAt,
    });
    return token;
  }),
  // PROTECTED route - only agent owner can view details
  remove: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const [removedMeeting] = await db
        .delete(meetings)
        .where(
          and(eq(meetings.id, input.id), eq(meetings.userId, ctx.auth.user.id))
        )
        .returning();
      if (!removedMeeting) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Meeting not found",
        });
      }
      return removedMeeting;
    }),
  update: protectedProcedure
    .input(meetingsUpdateSchema)
    .mutation(async ({ input, ctx }) => {
      const [updatedMeeting] = await db
        .update(meetings)
        .set(input)
        .where(
          and(eq(meetings.id, input.id), eq(meetings.userId, ctx.auth.user.id))
        )
        .returning();
      if (!updatedMeeting) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Meeting not found",
        });
      }
      return updatedMeeting;
    }),
  create: protectedProcedure
    .input(meetingsInsertSchema)
    .mutation(async ({ input, ctx }) => {
      // Use the authenticated user's ID from the session
      const [createdMeeting] = await db
        .insert(meetings)
        .values({
          ...input,
          userId: ctx.auth.user.id,
        })
        .returning();
      const call = streamVideo.video.call("default", createdMeeting.id);
      await call.create({
        data: {
          created_by_id: ctx.auth.user.id,
          custom: {
            meetingId: createdMeeting.id,
            meetingName: createdMeeting.name,
          },
          settings_override: {
            transcription: {
              language: "en",
              mode: "auto-on",
              closed_caption_mode: "auto-on",
            },
            recording: {
              mode: "auto-on",
              quality: "1080p",
            },
          },
        },
      });
      const [existingAgent] = await db
        .select()
        .from(agents)
        .where(eq(agents.id, createdMeeting.agentId));
      if (!existingAgent) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Agent not found",
        });
      }
      await streamVideo.upsertUsers([
        {
          id: existingAgent.id,
          name: existingAgent.name || "Unknown Agent",
          role: "user",
          image: generateAvatarUri({
            seed: existingAgent.name,
            variant: "initials",
          }),
        },
      ]);
      //TODO : Create Stream Call , upsert Stream
      return createdMeeting;
    }),
  getOne: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input, ctx }) => {
      const [existingMeeting] = await db
        .select({
          ...getTableColumns(meetings),
          agents: agents,
          duration:
            sql<number>`EXTRACT(EPOCH FROM (${meetings.endedAt} - ${meetings.startedAt}))`.as(
              "duration"
            ),
          // meetingCount: sql<number>`5`,
        })
        .from(meetings)
        .innerJoin(agents, eq(meetings.agentId, agents.id))
        .where(
          and(eq(meetings.id, input.id), eq(meetings.userId, ctx.auth.user.id))
        );
      if (!existingMeeting) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Meeting not found",
        });
      }
      return existingMeeting || null;
    }),

  getMany: protectedProcedure
    .input(
      z
        .object({
          page: z.number().default(DEFAULT_PAGE),
          pageSize: z
            .number()
            .min(MIN_PAGE_SIZE)
            .max(MAX_PAGE_SIZE)
            .default(DEFAULT_PAGE_SIZE),
          search: z.string().nullish(),
          agentId: z.string().nullish(),
          status: z
            .enum([
              MeetingStatus.Upcoming,
              MeetingStatus.Active,
              MeetingStatus.Completed,
              MeetingStatus.Processing,
              MeetingStatus.Cancelled,
            ])
            .nullish(),
        })
        .default({})
    )
    .query(async ({ ctx, input }) => {
      const {
        search,
        page = DEFAULT_PAGE,
        pageSize = DEFAULT_PAGE_SIZE,
        status,
        agentId,
      } = input || {};

      const data = await db
        .select({
          ...getTableColumns(meetings),
          agent: agents,
          duration:
            sql<number>`EXTRACT(EPOCH FROM (${meetings.endedAt} - ${meetings.startedAt}))`.as(
              "duration"
            ),
          // meetingCount: sql<number>`5`,
        })
        .from(meetings)
        .innerJoin(agents, eq(meetings.agentId, agents.id))
        .where(
          and(
            eq(meetings.userId, ctx.auth.user.id),
            search ? ilike(meetings.name, `%${search}%`) : undefined,
            status ? eq(meetings.status, status) : undefined,
            agentId ? eq(meetings.agentId, agentId) : undefined
          )
        )
        .orderBy(desc(meetings.createdAt), desc(meetings.id))
        .limit(pageSize)
        .offset((page - 1) * pageSize);

      const [total] = await db
        .select({ count: count() })
        .from(meetings)
        .innerJoin(agents, eq(meetings.agentId, agents.id))
        .where(
          and(
            eq(meetings.userId, ctx.auth.user.id),
            search ? ilike(meetings.name, `%${search}%`) : undefined,
            status ? eq(meetings.status, status) : undefined,
            agentId ? eq(meetings.agentId, agentId) : undefined
          )
        );
      const totalPages = Math.ceil(total.count / pageSize);
      return {
        items: data,
        total: total.count,
        totalPages,
      };
    }),
});
