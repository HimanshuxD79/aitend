import { initTRPC, TRPCError } from "@trpc/server";
import { cache } from "react";
import { auth } from "@/lib/auth";

export const createTRPCContext = cache(async (opts?: { headers?: Headers }) => {
  /**
   * @see: https://trpc.io/docs/server/context
   */
  return {
    headers: opts?.headers || new Headers(),
  };
});
// Avoid exporting the entire t-object
// since it's not very descriptive.
// For instance, the use of a t variable
// is common in i18n libraries.
const t = initTRPC.context<typeof createTRPCContext>().create({
  /**
   * @see https://trpc.io/docs/server/data-transformers
   */
  // transformer: superjson,
});
// Base router and procedure helpers
export const createTRPCRouter = t.router;
export const createCallerFactory = t.createCallerFactory;
export const baseProcedure = t.procedure;
export const protectedProcedure = baseProcedure.use(async ({ ctx, next }) => {
  // REAL authentication check
  let session;

  try {
    // Get the actual session from Better Auth
    session = await auth.api.getSession({
      headers: ctx.headers || new Headers(),
    });
  } catch (error) {
    console.error("Auth error:", error);
    session = null;
  }

  // If no valid session, reject the request
  if (!session?.user?.id) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "You must be logged in to access this resource.",
    });
  }

  // Pass the REAL user session
  return next({
    ctx: {
      ...ctx,
      auth: session,
    },
  });
});
