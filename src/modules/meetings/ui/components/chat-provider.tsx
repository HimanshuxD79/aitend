"use client";
import { authClient } from "@/lib/auth-client";
import { LoadingState } from "@/components/ui/loading-state";
import { AIChat } from "./ai-chat";

interface Props {
  meetingId: string;
  meetingName: string;
}
export const ChatProvider = ({ meetingId, meetingName }: Props) => {
  const { data, isPending } = authClient.useSession();
  if (isPending || !data?.user) {
    return (
      <LoadingState
        title="Loading AI Chat..."
        description="Please wait while we load the AI meeting coach."
      />
    );
  }
  return (
    <AIChat
      meetingId={meetingId}
      meetingName={meetingName}
      userImage={data.user.image || undefined}
    />
  );
};
