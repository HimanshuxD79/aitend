import { CallView } from "@/modules/call/ui/views/call-view";
import { Suspense } from "react";

interface Props {
  params: Promise<{ meetingId: string }>;
}

export default async function CallPage({ params }: Props) {
  const { meetingId } = await params;

  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading call...</p>
          </div>
        </div>
      }
    >
      <CallView meetingId={meetingId} />
    </Suspense>
  );
}
