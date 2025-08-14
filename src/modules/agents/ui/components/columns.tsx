"use client";

import { ColumnDef } from "@tanstack/react-table";
import { AgentGetMany } from "../../types";
import { CornerDownRightIcon, Video } from "lucide-react";
import { Badge } from "@/components/ui/badge";
// This type is used to define the shape of our data.
// You can use a Zod schema here if you want.
// export type Payment = {
//   id: string;
//   amount: number;
//   status: "pending" | "processing" | "success" | "failed";
//   email: string;
// };

export const columns: ColumnDef<AgentGetMany[number]>[] = [
  {
    accessorKey: "name",
    header: "Agent Name",
    cell: ({ row }) => (
      <div className="flex flex-col gap-y-1">
        <span className="font-semibold capitalize">{row.original.name}</span>
        <div className="flex items-center gap-x-2">
          <div className="flex items-center gap-x-1">
            <CornerDownRightIcon className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">
              {row.original.instructions}{" "}
            </span>
          </div>
        </div>
      </div>
    ),
  },
  {
    accessorKey: "meetingCount",
    header: "Meetings",
    cell: ({ row }) => (
      <Badge
        variant="outline"
        className="flex items-center gap-x-2 [&>svg]:size-4"
      >
        <Video className="text-blue-700" />
        {/* {row.original.meetingCount}{" "}
        {row.original.meetingCount === 1 ? "Meeting" : "Meetings"} */}
        {row.original.meetingCount}{" "}
        {row.original.meetingCount === 1 ? "Meeting" : "Meetings"}
      </Badge>
    ),
  },
];
