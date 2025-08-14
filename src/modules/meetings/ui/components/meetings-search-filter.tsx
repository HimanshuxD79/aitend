import { SearchIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useMeetingsFilters } from "../../hooks/use-meetings-filters";
export const MeetingsSearchFilter = () => {
  const [filters, setFilters] = useMeetingsFilters();
  return (
    <div className="relative w-full max-w-sm">
      <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
      <Input
        placeholder="Search meetings..."
        value={filters.search}
        onChange={(e) => setFilters({ search: e.target.value })}
        className="pl-10 w-full"
      />
    </div>
  );
};
