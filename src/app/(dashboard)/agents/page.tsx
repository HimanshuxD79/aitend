import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { Suspense } from "react";
import { AgentsView } from "@/modules/agents/ui/views/agents-view";
import { loadSearchParams } from "@/modules/agents/params";
import type { SearchParams } from "nuqs";
import { getQueryClient } from "@/trpc/server";
import { AgentsViewLoading } from "@/modules/agents/ui/views/agents-view";
import { AgentsListHeader } from "@/modules/agents/ui/components/agents-list-header";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
interface Props {
  searchParams: Promise<SearchParams>;
}
const Page = async ({ searchParams }: Props) => {
  // Load search params for client-side use
  await loadSearchParams(searchParams);

  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session) {
    redirect("/sign-in");
  }
  const queryClient = getQueryClient();

  // Remove server-side prefetching to avoid authentication issues
  // The client will handle the queries with proper authentication

  return (
    <>
      <AgentsListHeader />
      <HydrationBoundary state={dehydrate(queryClient)}>
        <Suspense fallback={<AgentsViewLoading />}>
          <AgentsView />
        </Suspense>
      </HydrationBoundary>
    </>
  );
};

export default Page;
