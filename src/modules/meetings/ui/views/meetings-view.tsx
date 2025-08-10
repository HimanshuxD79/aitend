"use client";

import { useTRPC } from "@/trpc/client";
import { useSuspenseQuery } from "@tanstack/react-query";
import { LoadingState } from "@/components/ui/loading-state";
import { ErrorState } from "@/components/ui/error-state";

export const MeetingsView = () => {
  const utils = useTRPC();

  const { data, error } = useSuspenseQuery(
    utils.meetings.getMany.queryOptions({})
  );

  if (error) {
    console.error("Meetings error:", error);
    return <MeetingsViewError />;
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Meetings</h1>
      <div className="bg-gray-100 p-4 rounded-lg">
        <pre className="text-sm overflow-auto">
          {JSON.stringify(data, null, 2)}
        </pre>
      </div>
    </div>
  );
};

export const MeetingsViewLoading = () => {
  return (
    <LoadingState
      title="Loading Meetings..."
      description="Please wait while we fetch the meetings."
    />
  );
};

export const MeetingsViewError = () => {
  return (
    <ErrorState
      title="Error Loading Meetings"
      description="There was an error loading the meetings."
    />
  );
};
