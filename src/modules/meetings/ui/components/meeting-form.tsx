import { z } from "zod";
import { MeetingGetOne } from "../../types";
import { useTRPC } from "@/trpc/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createTRPCClient, httpBatchLink } from "@trpc/client";
import type { AppRouter } from "@/trpc/routers/_app";
import { meetingsInsertSchema, meetingsUpdateSchema } from "../../schemas";
import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { CommandSelect } from "@/components/ui/command-select";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { toast } from "sonner";
import { NewAgentDialog } from "@/modules/agents/ui/components/new-agent-dialog";

interface MeetingFormProps {
  onSuccess?: (id?: string) => void;
  onCancel?: () => void;
  initialValues?: MeetingGetOne;
}
export const MeetingForm = ({
  onSuccess,
  onCancel,
  initialValues,
}: MeetingFormProps) => {
  const utils = useTRPC();
  const queryClient = useQueryClient();
  const [openNewAgentDialog, setOpenNewAgentDialog] = useState(false);
  const [agentSearch, setAgentSearch] = useState("");
  const [debouncedAgentSearch, setDebouncedAgentSearch] = useState("");

  // Debounce the search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedAgentSearch(agentSearch);
    }, 300); // 300ms delay

    return () => clearTimeout(timer);
  }, [agentSearch]);

  const agents = useQuery(
    utils.agents.getMany.queryOptions({
      pageSize: 100,
      search: debouncedAgentSearch,
    })
  );
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

  const createMeeting = useMutation({
    mutationFn: async (data: z.infer<typeof meetingsInsertSchema>) => {
      // Use the vanilla tRPC client directly
      return await trpcClient.meetings.create.mutate(data);
    },
    onSuccess: async (meeting) => {
      // Invalidate the meetings queries using queryClient
      await queryClient.invalidateQueries({
        queryKey: utils.meetings.getMany.queryOptions().queryKey,
      });
      if (initialValues?.id) {
        await queryClient.invalidateQueries({
          queryKey: utils.meetings.getOne.queryOptions({ id: initialValues.id })
            .queryKey,
        });
      }
      toast.success("Meeting created successfully!");
      onSuccess?.(meeting?.id);
    },
    onError: (error: Error) => {
      if (error.message.includes("UNAUTHORIZED")) {
        toast.error("Please sign in to create meetings");
      } else {
        toast.error(`Error creating meeting: ${error.message}`);
      }
      console.error("Error creating meeting:", error);
    },
  });

  const updateMeeting = useMutation({
    mutationFn: async (data: z.infer<typeof meetingsUpdateSchema>) => {
      // Use the vanilla tRPC client directly
      return await trpcClient.meetings.update.mutate(data);
    },
    onSuccess: async (meeting) => {
      // Invalidate the meetings queries using queryClient
      await queryClient.invalidateQueries({
        queryKey: utils.meetings.getMany.queryOptions().queryKey,
      });
      if (initialValues?.id) {
        await queryClient.invalidateQueries({
          queryKey: utils.meetings.getOne.queryOptions({ id: initialValues.id })
            .queryKey,
        });
      }
      toast.success("Meeting updated successfully!");
      onSuccess?.(meeting?.id || initialValues?.id);
    },
    onError: (error: Error) => {
      if (error.message.includes("UNAUTHORIZED")) {
        toast.error("Please sign in to create meetings");
      } else {
        toast.error(`Error creating meeting: ${error.message}`);
      }
      console.error("Error creating agent:", error);
    },
  });
  const isEdit = !!initialValues?.id;
  const isPending = createMeeting.isPending || updateMeeting.isPending;
  const onSubmit = async (data: z.infer<typeof meetingsInsertSchema>) => {
    if (isEdit) {
      const updateData: z.infer<typeof meetingsUpdateSchema> = {
        ...data,
        id: initialValues!.id,
      };
      updateMeeting.mutate(updateData);
    } else {
      createMeeting.mutate(data);
    }
  };

  const form = useForm<z.infer<typeof meetingsInsertSchema>>({
    resolver: zodResolver(meetingsInsertSchema),
    defaultValues: {
      name: initialValues?.name ?? "",
      agentId: initialValues?.agentId ?? "",
    },
  });
  return (
    <>
      <NewAgentDialog
        open={openNewAgentDialog}
        onOpenChange={setOpenNewAgentDialog}
      />
      <Form {...form}>
        <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="agentId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Agent</FormLabel>
                <FormControl>
                  <CommandSelect
                    options={(agents.data?.items ?? []).map((agent) => ({
                      id: agent.id,
                      value: agent.id,
                      children: (
                        <div className="flex items-center gap-x-2">
                          <span>{agent.name}</span>
                        </div>
                      ),
                    }))}
                    onSelect={(value) => field.onChange(value)}
                    onSearch={setAgentSearch}
                    value={field.value}
                    placeholder="Select an agent"
                    isLoading={agents.isLoading}
                    emptyMessage="No agents found"
                  />
                </FormControl>
                <FormDescription>
                  Not found what you:&apos;re looking for?{" "}
                  <Button
                    type="button"
                    className="text-primary hover:underline cursor-pointer"
                    variant="link"
                    onClick={() => setOpenNewAgentDialog(true)}
                  >
                    Create a new agent
                  </Button>
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex gap-2">
            <Button type="submit" disabled={isPending}>
              {isPending
                ? isEdit
                  ? "Updating..."
                  : "Creating..."
                : isEdit
                  ? "Update"
                  : "Create"}{" "}
              Agent
            </Button>
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            )}
          </div>
        </form>
      </Form>
    </>
  );
};
