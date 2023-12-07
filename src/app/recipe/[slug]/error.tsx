"use client";

import { Header } from "@/app/header";
import { Button } from "@/components/input/button";

export default function Error({
  error,
}: {
  error: Error & { digest?: string };
}) {
  return (
    <div className="flex justify-center items-center gap-2 flex-col flex-1">
      <h2>Something went wrong!</h2>
      <Button onClick={window.location.reload}>Try again</Button>
    </div>
  );
}
