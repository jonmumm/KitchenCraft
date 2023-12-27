"use client";

import { Button } from "@/components/input/button";
import { TypeLogo } from "@/components/logo";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  // TODO report an error server side here...

  return (
    <html>
      <head>
        <title>Oops | Something went wrong</title>
      </head>
      <body>
        <TypeLogo />
        <h1>Oops</h1>
        <p>Something went wrong</p>
        <Button onClick={() => reset()}>Reload</Button>
      </body>
    </html>
  );
}
