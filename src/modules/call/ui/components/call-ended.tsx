import Link from "next/link";

import { Button } from "@/components/ui/button";
export const CallEnded = () => {
  return (
    <div className="h-full w-full bg-gray-900 flex flex-col items-center justify-center">
      <div className="w-full max-w-2xl mx-auto px-8">
        <div className="bg-white rounded-lg p-8 shadow-lg">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              You have left the call
            </h1>
            <p className="text-gray-600">Summary will appear in few minutes.</p>
          </div>
          <Button asChild>
            <Link href="/meetings">Go to Meetings</Link>
          </Button>
        </div>
      </div>
    </div>
  );
};
