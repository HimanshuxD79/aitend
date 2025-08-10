import { MeetingsView } from "@/modules/meetings/ui/views/meetings-view";
import { Suspense } from "react";
import { MeetingsViewLoading } from "@/modules/meetings/ui/views/meetings-view";
import { trpc } from "@/trpc/server";
import { getQueryClient } from "@/trpc/server";
import { MeetingsListHeader } from "@/modules/meetings/ui/components/meetings-list-header";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { ErrorBoundary } from "next/dist/client/components/error-boundary";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
const Page = async () => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session) {
    redirect("/sign-in");
  }
  const queryClient = getQueryClient();
  void queryClient.prefetchQuery(trpc.meetings.getMany.queryOptions({}));
  return (
    <>
      <MeetingsListHeader />
      {/* <HydrationBoundary state={dehydrate(queryClient)}> */}
      <Suspense fallback={<MeetingsViewLoading />}>
        {/* <ErrorBoundary errorComponent={<div>Error loading meetings</div>}> */}
        <MeetingsView />
        {/* </ErrorBoundary> */}
      </Suspense>
      {/* </HydrationBoundary> */}
    </>
  );
};

export default Page;
