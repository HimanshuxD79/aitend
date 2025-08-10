import {
  CircleCheckIcon,
  CircleXIcon,
  ClockArrowUpIcon,
  LoaderIcon,
} from "lucide-react";
import { CommandSelect } from "@/components/ui/command-select";
import { MeetingStatus } from "../../types";
import { useMeetingsFilters } from "../../hooks/use-meetings-filters";
const options = [
  {
    id: MeetingStatus.Upcoming,
    value: MeetingStatus.Upcoming,
    children: (
      <div className="flex items-center gap-x-2 capitalize min-w-0">
        <ClockArrowUpIcon className="h-4 w-4 shrink-0" />
        <span className="truncate">{MeetingStatus.Upcoming}</span>
      </div>
    ),
  },
  {
    id: MeetingStatus.Completed,
    value: MeetingStatus.Completed,
    children: (
      <div className="flex items-center gap-x-2 capitalize min-w-0">
        <CircleCheckIcon className="h-4 w-4 shrink-0" />
        <span className="truncate">{MeetingStatus.Completed}</span>
      </div>
    ),
  },
  {
    id: MeetingStatus.Cancelled,
    value: MeetingStatus.Cancelled,
    children: (
      <div className="flex items-center gap-x-2 capitalize min-w-0">
        <CircleXIcon className="h-4 w-4 shrink-0" />
        <span className="truncate">{MeetingStatus.Cancelled}</span>
      </div>
    ),
  },
  {
    id: MeetingStatus.Processing,
    value: MeetingStatus.Processing,
    children: (
      <div className="flex items-center gap-x-2 capitalize min-w-0">
        <LoaderIcon className="h-4 w-4 shrink-0" />
        <span className="truncate">{MeetingStatus.Processing}</span>
      </div>
    ),
  },
  {
    id: MeetingStatus.Active,
    value: MeetingStatus.Active,
    children: (
      <div className="flex items-center gap-x-2 capitalize min-w-0">
        <LoaderIcon className="h-4 w-4 shrink-0" />
        <span className="truncate">{MeetingStatus.Active}</span>
      </div>
    ),
  },
];
export const StatusFilter = () => {
  const [filters, setFilters] = useMeetingsFilters();

  return (
    <div className="w-48 min-w-0">
      <CommandSelect
        options={options}
        value={filters.status || ""}
        onSelect={(value) => setFilters({ status: value as MeetingStatus })}
        placeholder="Select status..."
        className="w-full min-w-0"
      />
    </div>
  );
};
