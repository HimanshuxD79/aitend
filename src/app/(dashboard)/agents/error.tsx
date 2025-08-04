"use client";
import { ErrorState } from "@/components/ui/error-state";

const ErrorPage = () => {
  return (
    <ErrorState
      title="An error occurred"
      description="Please try again later or contact support if the issue persists."
    />
  );
};

export default ErrorPage;
