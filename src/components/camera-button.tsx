"use client";

import { CameraIcon } from "lucide-react";
import { Button } from "./input/button";

export const CameraButton = ({ slug }: { slug?: string }) => {
  if (!slug) {
    return (
      <Button variant={"ghost"} disabled size="icon">
        <CameraIcon />
      </Button>
    );
  }

  return (
    <Button variant={"outline"} size="icon">
      <CameraIcon />
    </Button>
  );
};
