import { serve } from "inngest/next";
import { inngest } from "../../../inngest/client";
import { meetingsProcessing, meetingsComplete } from "@/inngest/functions";

// Create an API that serves your functions
export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [meetingsProcessing, meetingsComplete],
});
