"use client";

import { useSuspenseQuery } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";
import { LoadingState } from "@/components/ui/loading-state";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { DataTable } from "@/components/ui/data-table";
import { columns } from "../components/columns";
import { useAgentsFilters } from "../../hooks/use-agents-filters";
import { DataPagination } from "../components/data-pagination";
import { useRouter } from "next/navigation";
export const AgentsView = () => {
  const router = useRouter();
  const [filters, setFilters] = useAgentsFilters();
  const trpc = useTRPC();
  const { data, isLoading, error } = useSuspenseQuery(
    trpc.agents.getMany.queryOptions({ ...filters })
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

  if (!data || data.items.length === 0) {
    return (
      <div className="text-center py-8">
        <h3 className="text-lg font-medium">No agents found</h3>
        <p className="text-muted-foreground">
          Create your first agent to get started.
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 pb-4 px-4 md:px-8 flex flex-col gap-y-4">
      <DataTable
        columns={columns}
        data={data.items}
        onRowClick={(row) => router.push(`/agents/${row.id}`)}
      />
      <DataPagination
        page={filters.page}
        totalPages={data.totalPages}
        onPageChange={(page) => {
          setFilters((prev) => ({ ...prev, page }));
        }}
      />
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
