import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { Suspense } from "react";
import { AgentsView } from "@/modules/agents/ui/views/agents-view";
import { get } from "http";
import { getQueryClient, trpc } from "@/trpc/server";
import { LoadingState } from "@/components/ui/loading-state";
import { AgentsViewLoading } from "@/modules/agents/ui/views/agents-view";
const Page = async () => {
  const queryClient = getQueryClient();
  await queryClient.prefetchQuery(trpc.agents.getMany.queryOptions());

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <Suspense fallback={<AgentsViewLoading />}>
        <AgentsView />
      </Suspense>
    </HydrationBoundary>
  );
};
export default Page;
