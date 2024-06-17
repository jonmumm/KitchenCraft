"use client";

import { Button } from "@/components/input/button";
import { TypeLogo } from "@/components/logo";
import * as Sentry from "@sentry/nextjs";
import Error from "next/error";
import { useEffect } from "react";

export default function GlobalError({
  error, // reset,
}: {
  error: Error & { digest?: string };
  // reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html>
      <head>
        <title>Oops | Something went wrong</title>
      </head>
      <body>
        <TypeLogo />
        <h1>Oops</h1>
        <p>Something went wrong</p>
        <Button onClick={() => window.location.reload()}>Reload</Button>
      </body>
    </html>
  );
}
