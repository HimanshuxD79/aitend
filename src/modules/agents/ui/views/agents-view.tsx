"use client";

import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";
import { LoadingState } from "@/components/ui/loading-state";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { DataTable } from "../components/data-table";
import { columns, Payment } from "../components/columns";
export const AgentsView = () => {
  const trpc = useTRPC();
  const { data, isLoading, error } = useQuery(
    trpc.agents.getMany.queryOptions()
  );

  if (isLoading) {
    return (
      <LoadingState
        title="Loading Agents..."
        description="Please wait while we fetch the agents."
      />
    );
  }

  if (error) {
    // Check if it's an authentication error
    if (
      error.message.includes("UNAUTHORIZED") ||
      error.message.includes("401")
    ) {
      return (
        <div className="flex flex-col items-center justify-center h-full py-8">
          <div className="text-center">
            <h3 className="text-lg font-medium">Sign In Required</h3>
            <p className="text-muted-foreground mb-4">
              You need to be signed in to view agents.
            </p>
            <Button asChild>
              <Link href="/sign-in">Sign In</Link>
            </Button>
          </div>
        </div>
      );
    }

    // Other errors
    return (
      <div className="flex flex-col items-center justify-center h-full py-8">
        <div className="text-center">
          <h3 className="text-lg font-medium">Failed to Load Agents</h3>
          <p className="text-muted-foreground mb-4">
            {error.message || "An unexpected error occurred."}
          </p>
          <Button onClick={() => window.location.reload()}>Try Again</Button>
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="text-center py-8">
        <h3 className="text-lg font-medium">No agents found</h3>
        <p className="text-muted-foreground">
          Create your first agent to get started.
        </p>
      </div>
    );
  }
  const mockData: Payment[] = [
    {
      id: "728ed52f",
      amount: 100,
      status: "pending",
      email: "m@example.com",
    },
    // ...
  ];
  return (
    <div className="flex-1 pb-4 px-4 md:px-8 flex flex-col gap-y-4">
      <DataTable columns={columns} data={data} />
      {/* {JSON.stringify(data, null, 2)} */}
    </div>
  );
};
export const AgentsViewLoading = () => {
  return (
    <LoadingState
      title="Loading Agents..."
      description="Please wait while we fetch the agents."
    />
  );
};
