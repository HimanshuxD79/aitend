"use client";

import { MeetingError } from "@/components/ui/meeting-error";

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ error, reset }: ErrorPageProps) {
  return <MeetingError error={error} reset={reset} />;
}
