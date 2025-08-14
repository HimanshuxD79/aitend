"use client";

import { ColumnDef } from "@tanstack/react-table";
// import { AgentGetOne } from "../../types";
import {
  CircleCheckIcon,
  CircleXIcon,
  ClockArrowUpIcon,
  CornerDownRightIcon,
  LoaderIcon,
} from "lucide-react";
import { MeetingGetMany } from "../../types";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import humanizeDuration from "humanize-duration";
import { cn } from "@/lib/utils";
// This type is used to define the shape of our data.
// You can use a Zod schema here if you want.
// export type Payment = {
//   id: string;
//   amount: number;
//   status: "pending" | "processing" | "success" | "failed";
//   email: string;
// };

function formatDuration(seconds: number) {
  return humanizeDuration(seconds * 1000, {
    largest: 1,
    round: true,
    units: ["h", "m", "s"],
  });
}
const statusIconMap = {
  upcoming: ClockArrowUpIcon,
  active: LoaderIcon,
  completed: CircleCheckIcon,
  processing: LoaderIcon,
  cancelled: CircleXIcon,
};
const statusColorMap = {
  upcoming: "text-blue-500",
  active: "text-green-500",
  completed: "text-gray-500",
  processing: "text-yellow-500",
  cancelled: "text-red-500",
};
export const columns: ColumnDef<MeetingGetMany[number]>[] = [
  {
    accessorKey: "name",
    header: "Meeting Name",
    cell: ({ row }) => (
      <div className="flex flex-col gap-y-1">
        <span className="font-semibold capitalize">{row.original.name}</span>
        <div className="flex items-center gap-x-2">
          <div className="flex items-center gap-x-1">
            <CornerDownRightIcon className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">
              {row.original.agent.name}{" "}
            </span>
            <span className="text-xs text-muted-foreground">
              {row.original.startedAt
                ? format(new Date(row.original.startedAt), "MMM dd, yyyy")
                : "Not started"}
            </span>
          </div>
        </div>
      </div>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const Icon =
        statusIconMap[row.original.status as keyof typeof statusIconMap];
      return (
        <Badge
          variant="outline"
          className={cn(
            statusColorMap[row.original.status as keyof typeof statusColorMap],
            "flex items-center gap-x-2"
          )}
        >
          <Icon className="h-4 w-4" />
          <span className="text-sm font-medium">
            {row.original.status.charAt(0).toUpperCase() +
              row.original.status.slice(1)}
          </span>
        </Badge>
      );
    },
  },
  {
    accessorKey: "duration",
    header: "Duration",
    cell: ({ row }) => {
      return (
        <Badge variant="outline" className="flex items-center gap-x-2">
          <span className="text-sm font-medium">
            {formatDuration(row.original.duration)}
          </span>
        </Badge>
      );
    },
  },
];
