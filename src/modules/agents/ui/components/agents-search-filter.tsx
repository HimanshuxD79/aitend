import { SearchIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useAgentsFilters } from "../../hooks/use-agents-filters";
export const AgentsSearchFilter = () => {
  const [filters, setFilters] = useAgentsFilters();
  return (
    <div className="flex items-center gap-x-2">
      <SearchIcon className="text-muted-foreground" />
      <Input
        placeholder="Search agents..."
        value={filters.search}
        onChange={(e) => setFilters({ search: e.target.value })}
      />
    </div>
  );
};
