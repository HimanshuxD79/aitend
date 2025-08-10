import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getQueryClient } from "@/trpc/server";
import { trpc } from "@/trpc/server";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { Suspense } from "react";
import { MeetingIdView } from "@/modules/meetings/ui/views/meeting-id-view";

interface Props {
  params: Promise<{ meetingId: string }>;
}

const Page = async ({ params }: Props) => {
  const meetingId = await params.then((p) => p.meetingId);

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/sign-in");
  }

  const queryClient = getQueryClient();

  try {
    // Prefetch the meeting data
    await queryClient.prefetchQuery(
      trpc.meetings.getOne.queryOptions({ id: meetingId })
    );
  } catch (error) {
    console.error("Error prefetching meeting:", error);
    // Don't throw here, let the client handle the error
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <Suspense fallback={<div>Loading meeting details...</div>}>
        <MeetingIdView meetingId={meetingId} />
      </Suspense>
    </HydrationBoundary>
  );
};

export default Page;
