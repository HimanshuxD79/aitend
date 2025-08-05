import { db } from "@/db";
import { agents } from "@/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";
import {
  createTRPCRouter,
  baseProcedure,
  protectedprocedure,
} from "@/trpc/init";
import { agentsInsertSchema } from "../schemas";

export const agentsRouter = createTRPCRouter({
  // PUBLIC routes - anyone can view agents
  getOne: baseProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const [existingAgent] = await db
        .select()
        .from(agents)
        .where(eq(agents.id, input.id));
      return existingAgent || null;
    }),

  getMany: baseProcedure.query(async () => {
    const data = await db.select().from(agents);
    return data;
  }),

  // PROTECTED route - only logged-in users can create agents
  create: protectedprocedure
    .input(agentsInsertSchema)
    .mutation(async ({ input, ctx }) => {
      // Use the authenticated user's ID from the session
      const [createdAgent] = await db
        .insert(agents)
        .values({
          ...input,
          userId: ctx.auth.user.id,
        })
        .returning();
      return createdAgent;
    }),
});
