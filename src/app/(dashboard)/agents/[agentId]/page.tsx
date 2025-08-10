import { HydrationBoundary, dehydrate } from "@tanstack/react-query";
import { getQueryClient } from "@/trpc/server";
import { Suspense } from "react";
import {
  AgentIdView,
  AgentsIdViewError,
} from "@/modules/agents/ui/views/agent-id-view";
import { AgentsIdViewLoading } from "@/modules/agents/ui/views/agent-id-view";
import { ErrorBoundary } from "next/dist/client/components/error-boundary";
interface Props {
  params: Promise<{ agentId: string }>;
}
const page = async ({ params }: Props) => {
  const { agentId } = await params;
  const queryClient = getQueryClient();

  // Remove server-side prefetching to avoid authentication issues
  // Let the client handle the query with proper authentication

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <Suspense fallback={<AgentsIdViewLoading />}>
        <ErrorBoundary errorComponent={AgentsIdViewError}>
          <AgentIdView agentId={agentId} />{" "}
        </ErrorBoundary>
      </Suspense>
    </HydrationBoundary>
  );
};
export default page;
