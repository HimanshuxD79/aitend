import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MeetingGetOne } from "../../types";
import ReactMarkdown from "react-markdown";
import Link from "next/link";
import {
  SparklesIcon,
  BookOpenTextIcon,
  FileVideoIcon,
  FileTextIcon,
} from "lucide-react";
import { Transcript } from "./transcript";
import { ChatProvider } from "./chat-provider";
interface Props {
  data: MeetingGetOne;
}

export const CompletedState = ({ data }: Props) => {
  return (
    <div className="flex flex-col gap-y-4">
      <Tabs defaultValue="summary">
        <div className="bg-white rounded-lg border px-3">
          <ScrollArea>
            <TabsList className="p-0 bg-background justify-start rounded-none h-13">
              <TabsTrigger
                value="summary"
                className="text-muted-foreground rounded-none bg-background data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-b-primary data-[state=active]:text-accent-foreground h-full hover:text-accent-foreground"
              >
                <BookOpenTextIcon className="mr-2 h-4 w-4" />
                Summary
              </TabsTrigger>
              <TabsTrigger
                value="transcript"
                className="text-muted-foreground rounded-none bg-background data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-b-primary data-[state=active]:text-accent-foreground h-full hover:text-accent-foreground"
              >
                <FileTextIcon className="mr-2 h-4 w-4" />
                Transcript
              </TabsTrigger>
              {data.recordingUrl && (
                <TabsTrigger
                  value="recording"
                  className="text-muted-foreground rounded-none bg-background data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-b-primary data-[state=active]:text-accent-foreground h-full hover:text-accent-foreground"
                >
                  <FileVideoIcon className="mr-2 h-4 w-4" />
                  Recording
                </TabsTrigger>
              )}
              <TabsTrigger
                value="chat"
                className="text-muted-foreground rounded-none bg-background data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-b-primary data-[state=active]:text-accent-foreground h-full hover:text-accent-foreground"
              >
                <SparklesIcon className="mr-2 h-4 w-4" />
                Ask AI
              </TabsTrigger>
            </TabsList>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </div>

        <TabsContent value="summary">
          <div className="bg-white rounded-lg border">
            <div className="px-4 py-5 gap-y-5 flex flex-col">
              <h2 className="text-2xl font-medium capitalize">{data.name}</h2>

              <div className="flex gap-x-2 items-center">
                <Link
                  href={`/agents/${data.agents.id}`}
                  className="flex items-center gap-x-2 underline underline-offset-4 capitalize text-blue-600 hover:text-blue-800"
                >
                  Agent: {data.agents.name}
                </Link>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold text-gray-700 mb-2">
                    Meeting Details
                  </h3>
                  {data.startedAt && (
                    <p className="text-gray-600">
                      Started: {new Date(data.startedAt).toLocaleString()}
                    </p>
                  )}
                  {data.endedAt && (
                    <p className="text-gray-600">
                      Ended: {new Date(data.endedAt).toLocaleString()}
                    </p>
                  )}
                  {data.duration && (
                    <p className="text-gray-600">
                      Duration: {Math.round(data.duration / 60)} minutes
                    </p>
                  )}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-700 mb-2">Agent</h3>
                  <p className="text-gray-600">{data.agents.instructions}</p>
                </div>
              </div>

              {data.summary && (
                <div className="mt-4">
                  <h3 className="font-semibold text-gray-700 mb-2">
                    Meeting Summary
                  </h3>
                  <div className="prose prose-sm max-w-none bg-gray-50 p-4 rounded-lg">
                    <ReactMarkdown>{data.summary}</ReactMarkdown>
                  </div>
                </div>
              )}

              {!data.summary && (
                <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-yellow-800 font-medium mb-2">
                    {data.status === "processing"
                      ? "Processing Meeting..."
                      : "Summary Not Available"}
                  </p>
                  <p className="text-yellow-700 text-sm">
                    {data.status === "processing"
                      ? "Your meeting is still being processed. This may take a few moments for transcript generation and AI summarization."
                      : "Meeting completed. Transcript processing took longer than expected or was not available. This typically happens for meetings under 1 minute or when no transcript was generated."}
                  </p>
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="transcript">
          <Transcript meetingId={data.id} />
        </TabsContent>
        {data.recordingUrl && (
          <TabsContent value="recording">
            <div className="bg-white rounded-lg border px-4 py-5">
              <h3 className="font-semibold text-gray-700 mb-4">
                Meeting Recording
              </h3>
              <video
                src={data.recordingUrl}
                className="w-full rounded-lg"
                controls
              />
            </div>
          </TabsContent>
        )}

        <TabsContent value="chat">
          <ChatProvider meetingId={data.id} meetingName={data.name} />
        </TabsContent>
      </Tabs>
    </div>
  );
};
