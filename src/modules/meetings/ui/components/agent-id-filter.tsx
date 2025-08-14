import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";
import { CommandSelect } from "@/components/ui/command-select";
import { useMeetingsFilters } from "../../hooks/use-meetings-filters";

export const AgentIdFilter = () => {
  const [filters, setFilters] = useMeetingsFilters();
  const utils = useTRPC();
  const [agentSearch, setAgentSearch] = useState("");
  const [debouncedAgentSearch, setDebouncedAgentSearch] = useState("");

  // Debounce the search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedAgentSearch(agentSearch);
    }, 300); // 300ms delay

    return () => clearTimeout(timer);
  }, [agentSearch]);

  const { data } = useQuery(
    utils.agents.getMany.queryOptions({
      pageSize: 100,
      search: debouncedAgentSearch,
    })
  );

  return (
    <div className="w-48 min-w-0">
      <CommandSelect
        options={(data?.items ?? []).map((agent) => ({
          id: agent.id,
          value: agent.id,
          children: (
            <div className="flex items-center gap-x-2 capitalize min-w-0">
              <span className="truncate">{agent.name}</span>
            </div>
          ),
        }))}
        value={filters.agentId || ""}
        onSelect={(value) => setFilters({ agentId: value })}
        onSearch={setAgentSearch}
        placeholder="Select agent..."
        className="w-full min-w-0"
      />
    </div>
  );
};
