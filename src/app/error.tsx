"use client"; // Error components must be Client Components

import { Card } from "@/components/display/card";
import { Button } from "@/components/input/button";
import { useSend } from "@/hooks/useSend";
import { getErrorMessage } from "@/lib/error";
import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const send = useSend();

  useEffect(() => {
    send({ type: "ERROR", error: getErrorMessage(error) });
  }, [send, error]);
  // TODO log an error here..
  return (
    <div className="max-w-lg mx-auto w-full p-4">
      <Card className="p-4 flex flex-col gap-2 items-center">
        <h1 className="font-semibold text-xl">Oops</h1>
        <p className="text-muted-foreground">Something went wrong</p>
        <Button onClick={() => window.location.reload()}>Reload</Button>
      </Card>
    </div>
  );
}
