"use client";

import { useEffect } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

const ErrorPage = ({ error, reset }: ErrorPageProps) => {
  useEffect(() => {
    console.error("Page error:", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--color-opinion-against)]/10 border border-[var(--color-opinion-against)]/20">
        <AlertTriangle className="h-7 w-7 text-[var(--color-opinion-against)]" />
      </div>
      <h1 className="text-xl font-bold font-[family-name:var(--font-display)] text-foreground mb-2">
        Something went wrong
      </h1>
      <p className="text-sm text-muted-foreground mb-6 max-w-md">
        {error.message || "An unexpected error occurred"}
      </p>
      <Button
        onClick={reset}
        className="bg-[var(--color-accent-amber)] text-[var(--color-void)] hover:bg-[var(--color-accent-warm)]"
      >
        <RotateCcw className="h-4 w-4 mr-2" />
        Try Again
      </Button>
    </div>
  );
};

export default ErrorPage;
