"use client";
import { Button } from "@/components/ui/button";
import { PlusIcon, XCircleIcon } from "lucide-react";
import { NewMeetingDialog } from "./new-meeting-dialog";
import { useState } from "react";
import { MeetingsSearchFilter } from "./meetings-search-filter";
import { StatusFilter } from "./status-filter";
import { AgentIdFilter } from "./agent-id-filter";
import { useMeetingsFilters } from "../../hooks/use-meetings-filters";
import { ScrollArea } from "@radix-ui/react-scroll-area";
import { ScrollBar } from "@/components/ui/scroll-area";

export const MeetingsListHeader = () => {
  const [filters, setFilters] = useMeetingsFilters();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const isAnyFilterModified =
    !!filters.status || !!filters.agentId || !!filters.search;

  const onClearFilters = () => {
    setFilters({ status: null, agentId: null, search: null, page: null });
  };
  return (
    <>
      <NewMeetingDialog open={isDialogOpen} onOpenChange={setIsDialogOpen} />
      <div className="py-4 px-4 md:px-8 flex flex-col  gap-y-4">
        <div className="flex items-center justify-between">
          <h5 className="font-medium text-xl">My Meetings</h5>
          <Button onClick={() => setIsDialogOpen(true)}>
            <PlusIcon className="mr-2" />
            New Meeting
          </Button>
        </div>
        <ScrollArea>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-x-4">
            <div className="flex-1 min-w-0 w-full sm:w-auto">
              <MeetingsSearchFilter />
            </div>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <StatusFilter />
              {isAnyFilterModified && (
                <Button variant="outline" onClick={onClearFilters}>
                  <XCircleIcon className="mr-2" />
                  Clear Filters
                </Button>
              )}
              <AgentIdFilter />
            </div>
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </div>
    </>
  );
};
