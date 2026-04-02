"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html>
      <body className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center space-y-4 max-w-sm px-4">
          <h2 className="text-lg font-semibold">Something went wrong</h2>
          <p className="text-sm text-muted-foreground">
            An unexpected error occurred. It has been reported automatically.
          </p>
          <Button onClick={reset} variant="outline" size="sm">
            Try again
          </Button>
        </div>
      </body>
    </html>
  );
}
