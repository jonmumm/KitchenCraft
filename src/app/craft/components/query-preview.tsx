"use client";

import { useSearchParams } from "next/navigation";

export const QueryPreview = () => {
  const searchParams = useSearchParams();

  const prompt = searchParams.get("prompt");

  return <span>{prompt}</span>;
};
