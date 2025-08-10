"use client";

interface MeetingErrorProps {
  error: Error;
  reset: () => void;
}

export function MeetingError({ error, reset }: MeetingErrorProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] p-8">
      <div className="text-center space-y-4">
        <h2 className="text-xl font-semibold text-red-600">
          Error Loading Meeting
        </h2>
        <p className="text-gray-600">
          {error.message || "Something went wrong while loading the meeting."}
        </p>
        <button
          onClick={reset}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}
