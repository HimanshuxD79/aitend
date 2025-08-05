import { z } from "zod";
import { AgentGetOne } from "../../types";
import { useTRPC } from "@/trpc/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { agentsInsertSchema } from "../../schemas";
import { Textarea } from "@/components/ui/textarea";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createTRPCClient, httpBatchLink } from "@trpc/client";
import type { AppRouter } from "@/trpc/routers/_app";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { toast } from "sonner";

interface AgentFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  initialValues?: AgentGetOne;
}
export const AgentForm = ({
  onSuccess,
  onCancel,
  initialValues,
}: AgentFormProps) => {
  const utils = useTRPC();
  const queryClient = useQueryClient();

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

  const createAgent = useMutation({
    mutationFn: async (data: z.infer<typeof agentsInsertSchema>) => {
      // Use the vanilla tRPC client directly
      return await trpcClient.agents.create.mutate(data);
    },
    onSuccess: async () => {
      // Invalidate the agents queries using queryClient
      await queryClient.invalidateQueries({
        queryKey: utils.agents.getMany.queryOptions().queryKey,
      });
      if (initialValues?.id) {
        await queryClient.invalidateQueries({
          queryKey: utils.agents.getOne.queryOptions({ id: initialValues.id })
            .queryKey,
        });
      }
      toast.success("Agent created successfully!");
      onSuccess?.();
    },
    onError: (error: Error) => {
      if (error.message.includes("UNAUTHORIZED")) {
        toast.error("Please sign in to create agents");
      } else {
        toast.error(`Error creating agent: ${error.message}`);
      }
      console.error("Error creating agent:", error);
    },
  });

  const isEdit = !!initialValues?.id;

  const onSubmit = async (data: z.infer<typeof agentsInsertSchema>) => {
    if (isEdit) {
      console.log("TODO: UpdateAgent");
    } else {
      createAgent.mutate(data);
    }
  };

  const form = useForm<z.infer<typeof agentsInsertSchema>>({
    resolver: zodResolver(agentsInsertSchema),
    defaultValues: {
      name: initialValues?.name ?? "",
      instructions: initialValues?.instructions ?? "",
    },
  });
  return (
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
          name="instructions"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Instructions</FormLabel>
              <FormControl>
                <Textarea {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex gap-2">
          <Button type="submit" disabled={createAgent.isPending}>
            {createAgent.isPending
              ? "Creating..."
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
  );
};
