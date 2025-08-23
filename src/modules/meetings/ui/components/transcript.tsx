import { useState } from "react";
import { format } from "date-fns";
import { SearchIcon } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

interface Props {
  meetingId: string;
}

export const Transcript = ({ meetingId }: Props) => {
  const trpc = useTRPC();
  const { data: transcriptData, isLoading } = useQuery(
    trpc.meetings.getTranscript.queryOptions({ id: meetingId })
  );
  const { data: meetingData } = useQuery(
    trpc.meetings.getOne.queryOptions({ id: meetingId })
  );
  const [searchQuery, setSearchQuery] = useState("");

  // Debug logging
  console.log("Transcript Debug:", {
    meetingId,
    transcriptData,
    meetingData,
    transcriptUrl: meetingData?.transcriptUrl,
    recordingUrl: meetingData?.recordingUrl,
    status: meetingData?.status,
  });

  const filteredData = (transcriptData ?? []).filter((item) =>
    item.text.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border px-4 py-5 flex flex-col gap-y-4 w-full">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            <div className="h-4 bg-gray-200 rounded w-4/6"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!transcriptData || transcriptData.length === 0) {
    // Check if we have a processed transcript stored in the meeting data
    const transcriptText = (meetingData as unknown as Record<string, unknown>)
      ?.transcript as string;
    if (transcriptText) {
      return (
        <div className="bg-white rounded-lg border px-4 py-5 flex flex-col gap-y-4 w-full">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">Transcript</p>
            <span className="text-xs text-gray-500">Processed transcript</span>
          </div>

          <div className="relative">
            <SearchIcon className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search transcript..."
              className="pl-8 h-9 w-full max-w-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <ScrollArea className="h-96 w-full">
            <div className="space-y-2 pr-4">
              <pre className="whitespace-pre-wrap text-sm leading-relaxed font-sans bg-gray-50 p-4 rounded-lg">
                {searchQuery ? (
                  <span
                    dangerouslySetInnerHTML={{
                      __html: transcriptText.replace(
                        new RegExp(`(${searchQuery})`, "gi"),
                        '<mark class="bg-yellow-200">$1</mark>'
                      ),
                    }}
                  />
                ) : (
                  transcriptText
                )}
              </pre>
            </div>
          </ScrollArea>

          {searchQuery &&
            !transcriptText
              .toLowerCase()
              .includes(searchQuery.toLowerCase()) && (
              <div className="text-center py-4">
                <p className="text-gray-500">
                  No results found for &ldquo;{searchQuery}&rdquo;
                </p>
              </div>
            )}
        </div>
      );
    }

    return (
      <div className="bg-white rounded-lg border px-4 py-5 flex flex-col gap-y-4 w-full">
        <p className="text-sm font-medium">Transcript</p>
        <div className="text-center py-8">
          <p className="text-gray-500">
            No transcript available for this meeting.
          </p>
          <p className="text-sm text-gray-400 mt-2">
            Transcripts are generated for meetings longer than 1 minute with
            audio content.
          </p>
          {meetingData?.transcriptUrl && (
            <div className="mt-4">
              <p className="text-xs text-gray-500">
                Transcript URL found but failed to load:
              </p>
              <a
                href={meetingData.transcriptUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 hover:text-blue-700 underline text-xs break-all block mb-2"
              >
                {meetingData.transcriptUrl}
              </a>
              <button
                onClick={async () => {
                  if (!meetingData.transcriptUrl) return;

                  try {
                    const testUrl = `/api/test-transcript?url=${encodeURIComponent(
                      meetingData.transcriptUrl
                    )}`;
                    const response = await fetch(testUrl);
                    const result = await response.json();
                    console.log("Transcript test result:", result);
                    alert(
                      `Test result: ${
                        response.ok ? "SUCCESS" : "FAILED"
                      }\nCheck console for details`
                    );
                  } catch (error) {
                    console.error("Test failed:", error);
                    alert("Test failed - check console");
                  }
                }}
                className="px-2 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
              >
                Test Transcript Fetch
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border px-4 py-5 flex flex-col gap-y-4 w-full">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">Transcript</p>
        <span className="text-xs text-gray-500">
          {transcriptData.length} transcript items
        </span>
      </div>

      <div className="relative">
        <SearchIcon className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          placeholder="Search transcript..."
          className="pl-8 h-9 w-full max-w-sm"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <ScrollArea className="h-96 w-full">
        <div className="space-y-4 pr-4">
          {filteredData.map((item, index) => (
            <div
              key={index}
              className="flex gap-3 p-3 rounded-lg hover:bg-gray-50"
            >
              <Avatar className="h-8 w-8 flex-shrink-0">
                <AvatarImage src={item.user.image} alt={item.user.name} />
                <AvatarFallback>
                  {item.user.name
                    .split(" ")
                    .map((n: string) => n[0])
                    .join("")
                    .toUpperCase()}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium text-gray-900">
                    {item.user.name}
                  </span>
                  <span className="text-xs text-gray-500">
                    {format(new Date(item.start_ts), "HH:mm:ss")}
                  </span>
                </div>
                <p className="text-sm text-gray-700 leading-relaxed">
                  {searchQuery ? (
                    <span
                      dangerouslySetInnerHTML={{
                        __html: item.text.replace(
                          new RegExp(`(${searchQuery})`, "gi"),
                          '<mark class="bg-yellow-200">$1</mark>'
                        ),
                      }}
                    />
                  ) : (
                    item.text
                  )}
                </p>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      {searchQuery && filteredData.length === 0 && (
        <div className="text-center py-4">
          <p className="text-gray-500">
            No results found for &ldquo;{searchQuery}&rdquo;
          </p>
        </div>
      )}
    </div>
  );
};
