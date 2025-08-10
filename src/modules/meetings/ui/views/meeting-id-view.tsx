"use client";

import { useTRPC } from "@/trpc/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createTRPCClient, httpBatchLink } from "@trpc/client";
import type { AppRouter } from "@/trpc/routers/_app";
import { TRPCError } from "@trpc/server";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useConfirm } from "@/hooks/use-confirm";
import { MeetingIdViewHeader } from "../components/meeting-id-view-header";
import { UpdateMeetingDialog } from "../components/update-meeting-dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  PlayIcon,
  XCircleIcon,
  CheckCircleIcon,
  Loader2Icon,
  CalendarIcon,
} from "lucide-react";

interface Props {
  meetingId: string;
}

export const MeetingIdView = ({ meetingId }: Props) => {
  const utils = useTRPC();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [updateMeetingDialogOpen, setUpdateMeetingDialogOpen] = useState(false);

  // Create a vanilla tRPC client for queries with auth headers
  const trpcClient = createTRPCClient<AppRouter>({
    links: [
      httpBatchLink({
        url: "/api/trpc",
        headers() {
          return {
            // Include cookies for authentication
            cookie: document.cookie,
          };
        },
      }),
    ],
  });

  const removeMeeting = useMutation({
    mutationFn: async (data: { id: string }) => {
      return await trpcClient.meetings.remove.mutate(data);
    },
    onSuccess: async () => {
      // Invalidate the meetings queries
      await queryClient.invalidateQueries({
        queryKey: utils.meetings.getMany.queryOptions().queryKey,
      });
      toast.success("Meeting removed successfully!");
      // Redirect to meetings list after removal
      router.push("/meetings");
    },
    onError: (error: Error) => {
      toast.error(`Failed to remove meeting: ${error.message}`);
    },
  });

  const [CancelConfirmation, confirmCancel] = useConfirm(
    "Cancel Meeting",
    "Are you sure you want to cancel this meeting? This action cannot be undone."
  );

  const handleJoinMeeting = () => {
    // For now, this is a placeholder - you can integrate with your meeting platform
    toast.info("Joining meeting... (Integration with meeting platform needed)");
  };

  const handleCancelMeeting = async () => {
    const ok = await confirmCancel();
    if (!ok) return;
    // For now, we'll just show a message since status update isn't in the schema
    toast.info("Meeting cancellation requested (Status update API needed)");
  };

  const handleStartMeeting = () => {
    // Placeholder for starting a meeting
    toast.info(
      "Starting meeting... (Integration with meeting platform needed)"
    );
  };

  const {
    data: meeting,
    isLoading,
    error,
  } = useQuery({
    queryKey: utils.meetings.getOne.queryOptions({ id: meetingId }).queryKey,
    queryFn: () => trpcClient.meetings.getOne.query({ id: meetingId }),
    retry: (failureCount: number, error: unknown) => {
      // Don't retry on auth errors
      if (error instanceof TRPCError && error.code === "UNAUTHORIZED") {
        return false;
      }
      return failureCount < 3;
    },
  });

  const [RemoveConfirmation, confirmRemove] = useConfirm(
    "Confirm Meeting Removal",
    "Are you sure you want to remove this meeting?"
  );

  const handleRemoveMeeting = async () => {
    const ok = await confirmRemove();
    if (!ok) return;
    await removeMeeting.mutateAsync({ id: meetingId });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading meeting details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] p-8">
        <div className="text-center space-y-4">
          <h2 className="text-xl font-semibold text-red-600">
            Error Loading Meeting
          </h2>
          <p className="text-gray-600">
            {error instanceof Error
              ? error.message
              : "Something went wrong while loading the meeting."}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!meeting) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] p-8">
        <div className="text-center space-y-4">
          <h2 className="text-xl font-semibold text-gray-600">
            Meeting Not Found
          </h2>
          <p className="text-gray-500">
            The meeting you&apos;re looking for doesn&apos;t exist or you
            don&apos;t have access to it.
          </p>
        </div>
      </div>
    );
  }
  const isActive = meeting.status == "active";
  const isUpcoming = meeting.status == "upcoming";
  const isCancelled = meeting.status == "cancelled";
  const isCompleted = meeting.status == "completed";
  const isProcessing = meeting.status == "processing";
  return (
    <>
      <RemoveConfirmation />
      <CancelConfirmation />
      <UpdateMeetingDialog
        open={updateMeetingDialogOpen}
        onOpenChange={setUpdateMeetingDialogOpen}
        initialValues={meeting}
      />
      <div className="flex-1 py-4 px-4 md:px-8 flex flex-col gap-y-4">
        <MeetingIdViewHeader
          meetingId={meetingId}
          meetingName={meeting?.name}
          onEdit={() => setUpdateMeetingDialogOpen(true)}
          onRemove={handleRemoveMeeting}
        />

        {/* Status-based Action Section */}
        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Badge
                variant={
                  isCompleted
                    ? "default"
                    : isActive
                      ? "secondary"
                      : isCancelled
                        ? "destructive"
                        : isProcessing
                          ? "outline"
                          : "outline"
                }
                className="flex items-center gap-2"
              >
                {isActive && <PlayIcon className="h-3 w-3" />}
                {isUpcoming && <CalendarIcon className="h-3 w-3" />}
                {isCompleted && <CheckCircleIcon className="h-3 w-3" />}
                {isCancelled && <XCircleIcon className="h-3 w-3" />}
                {isProcessing && (
                  <Loader2Icon className="h-3 w-3 animate-spin" />
                )}
                {meeting.status.charAt(0).toUpperCase() +
                  meeting.status.slice(1)}
              </Badge>

              {isUpcoming && (
                <span className="text-sm text-gray-600">
                  Meeting is scheduled and ready to start
                </span>
              )}
              {isActive && (
                <span className="text-sm text-green-600">
                  Meeting is currently in progress
                </span>
              )}
              {isCompleted && (
                <span className="text-sm text-gray-600">
                  Meeting has been completed
                </span>
              )}
              {isCancelled && (
                <span className="text-sm text-red-600">
                  This meeting has been cancelled
                </span>
              )}
              {isProcessing && (
                <span className="text-sm text-blue-600">
                  Meeting is being processed
                </span>
              )}
            </div>

            {/* Action Buttons based on status */}
            <div className="flex gap-2">
              {isUpcoming && (
                <>
                  <Button
                    onClick={handleStartMeeting}
                    className="flex items-center gap-2"
                  >
                    <PlayIcon className="h-4 w-4" />
                    Start Meeting
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleCancelMeeting}
                    className="flex items-center gap-2"
                  >
                    <XCircleIcon className="h-4 w-4" />
                    Cancel
                  </Button>
                </>
              )}

              {isActive && (
                <Button
                  onClick={handleJoinMeeting}
                  className="flex items-center gap-2"
                >
                  <PlayIcon className="h-4 w-4" />
                  Join Meeting
                </Button>
              )}

              {isCompleted && (
                <span className="text-sm text-gray-500 flex items-center gap-2">
                  <CheckCircleIcon className="h-4 w-4" />
                  Meeting completed
                </span>
              )}

              {isCancelled && (
                <span className="text-sm text-red-500 flex items-center gap-2">
                  <XCircleIcon className="h-4 w-4" />
                  Meeting cancelled
                </span>
              )}

              {isProcessing && (
                <span className="text-sm text-blue-500 flex items-center gap-2">
                  <Loader2Icon className="h-4 w-4 animate-spin" />
                  Processing...
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border">
          <div className="px-4 py-5 gap-y-5 flex flex-col">
            <div className="flex items-center gap-x-3">
              <h2 className="text-lg font-medium">{meeting.name}</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="font-semibold text-gray-700">Meeting Details</h3>
                <p className="text-gray-600">ID: {meetingId}</p>
                <p className="text-gray-600">Status: {meeting.status}</p>
                {meeting.summary && (
                  <p className="text-gray-600">Summary: {meeting.summary}</p>
                )}
                {meeting.startedAt && (
                  <p className="text-gray-600">
                    Started: {new Date(meeting.startedAt).toLocaleString()}
                  </p>
                )}
                {meeting.endedAt && (
                  <p className="text-gray-600">
                    Ended: {new Date(meeting.endedAt).toLocaleString()}
                  </p>
                )}
                {meeting.duration && (
                  <p className="text-gray-600">
                    Duration: {Math.round(meeting.duration / 60)} minutes
                  </p>
                )}
              </div>
              {meeting.agents && (
                <div>
                  <h3 className="font-semibold text-gray-700">
                    Agent Information
                  </h3>
                  <p className="text-gray-600">Agent: {meeting.agents.name}</p>
                  <p className="text-gray-600">
                    Instructions: {meeting.agents.instructions}
                  </p>
                </div>
              )}
            </div>

            {(meeting.transcriptUrl || meeting.recordingUrl) && (
              <div className="mt-4">
                <h3 className="font-semibold text-gray-700">Resources</h3>
                <div className="flex gap-4">
                  {meeting.transcriptUrl && (
                    <a
                      href={meeting.transcriptUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-500 hover:text-blue-700 underline"
                    >
                      View Transcript
                    </a>
                  )}
                  {meeting.recordingUrl && (
                    <a
                      href={meeting.recordingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-500 hover:text-blue-700 underline"
                    >
                      View Recording
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Debug JSON - Remove this when you're satisfied with the UI */}
        <details className="mt-4">
          <summary className="cursor-pointer text-sm text-gray-500">
            Show raw data (debug)
          </summary>
          <pre className="bg-gray-100 p-4 rounded-lg text-sm overflow-auto mt-2">
            {JSON.stringify(meeting, null, 2)}
          </pre>
        </details>
      </div>
    </>
  );
};
