"use client"; // Error components must be Client Components

import { Header } from "@/app/header";
import { Button } from "@/components/ui/button";
import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error);
  }, [error]);

  return (
    <div className="flex justify-center items-center gap-2 flex-col flex-1">
      <Header />
      <h2>Something went wrong!</h2>
      <Button onClick={window.location.reload}>Try again</Button>
    </div>
  );
}
