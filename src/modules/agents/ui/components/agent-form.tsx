import { z } from "zod";
import { AgentGetOne } from "../../types";
import { useTRPC } from "@/trpc/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { agentsInsertSchema, agentsUpdateSchema } from "../../schemas";
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

  const updateAgent = useMutation({
    mutationFn: async (data: z.infer<typeof agentsUpdateSchema>) => {
      // Use the vanilla tRPC client directly
      return await trpcClient.agents.update.mutate(data);
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
      toast.success("Agent updated successfully!");
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
  const isPending = createAgent.isPending || updateAgent.isPending;
  const onSubmit = async (data: z.infer<typeof agentsInsertSchema>) => {
    if (isEdit) {
      const updateData: z.infer<typeof agentsUpdateSchema> = {
        ...data,
        id: initialValues!.id,
      };
      updateAgent.mutate(updateData);
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
  );
};
