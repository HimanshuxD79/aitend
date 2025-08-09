"use client";
import { useTRPC } from "@/trpc/client";
import { useState } from "react";
import {
  useSuspenseQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { LoadingState } from "@/components/ui/loading-state";
import { ErrorState } from "@/components/ui/error-state";
import { AgentIdViewHeader } from "../components/agent-id-view-header";
import { Badge } from "@/components/ui/badge";
import { VideoIcon } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { createTRPCClient, httpBatchLink } from "@trpc/client";
import type { AppRouter } from "@/trpc/routers/_app";
import { useConfirm } from "@/hooks/use-confirm";
import { UpdateAgentDialog } from "../components/update-agent-dialog";
interface Props {
  agentId: string;
}

export const AgentIdView = ({ agentId }: Props) => {
  const utils = useTRPC();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [updateAgentDialogOpen, setUpdateAgentDialogOpen] = useState(false);
  // Create a vanilla tRPC client for direct mutations with auth headers
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

  const removeAgent = useMutation({
    mutationFn: async (data: { id: string }) => {
      return await trpcClient.agents.remove.mutate(data);
    },
    onSuccess: async () => {
      // Invalidate the agents queries
      await queryClient.invalidateQueries({
        queryKey: utils.agents.getMany.queryOptions().queryKey,
      });
      toast.success("Agent removed successfully!");
      // Redirect to agents list after removal
      router.push("/agents");
    },
    onError: (error: Error) => {
      toast.error(`Failed to remove agent: ${error.message}`);
    },
  });

  const { data } = useSuspenseQuery(
    utils.agents.getOne.queryOptions({ id: agentId })
  );
  const [RemoveConfirmation, confirmRemove] = useConfirm(
    "Confirm Agent Removal",
    "Are you sure you want to remove this agent?"
  );
  const handleRemoveAgent = async () => {
    const ok = await confirmRemove();
    if (!ok) return;
    await removeAgent.mutateAsync({ id: agentId });
  };
  return (
    <>
      <RemoveConfirmation />
      <UpdateAgentDialog
        open={updateAgentDialogOpen}
        onOpenChange={setUpdateAgentDialogOpen}
        initialValues={data}
      />
      <div className="flex-1 py-4 px-4 md:px-8 flex flex-col gap-y-4">
        <AgentIdViewHeader
          agentId={agentId}
          agentName={data?.name}
          onEdit={() => setUpdateAgentDialogOpen(true)}
          onRemove={handleRemoveAgent}
        />
        <div className="bg-white rounded-lg border">
          <div className="px-4 py-5 gap-y-5 flex flex-col col-span-5">
            <div className="flex items-center gap-x-3">
              <h2 className="text-lg font-medium">{data?.name}</h2>
            </div>
            <Badge
              variant="outline"
              className="flex items-center gap-x-2 [&>svg]:size-4"
            >
              <VideoIcon className="text-blue-700" />
              {data.meetingCount}{" "}
              {data.meetingCount === 1 ? "Meeting" : "Meetings"}
            </Badge>
            <div className="flex flex-col gap-y-4">
              <p className="text-lg font-medium">Instructions</p>
              <p className="text-neutral-800">{data?.instructions}</p>
            </div>
          </div>
        </div>

        {/* Debug JSON - Remove this when you're satisfied with the UI */}
        <details className="mt-4">
          <summary className="cursor-pointer text-sm text-gray-500">
            Show raw data (debug)
          </summary>
          <pre className="bg-gray-100 p-4 rounded-lg text-sm overflow-auto mt-2">
            {JSON.stringify(data, null, 2)}
          </pre>
        </details>
      </div>
    </>
  );
};
export const AgentsIdViewLoading = () => {
  return (
    <LoadingState
      title="Loading Agents..."
      description="Please wait while we fetch the agents."
    />
  );
};
export const AgentsIdViewError = () => {
  return (
    <ErrorState
      title="Error Loading Agents"
      description="There was an error loading the agents."
    />
  );
};
