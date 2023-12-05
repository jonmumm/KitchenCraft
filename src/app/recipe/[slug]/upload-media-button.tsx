"use client";

import { Button } from "@/components/input/button";
import { env } from "@/env.public";
import { ToastAction } from "@/components/feedback/toast";
import { upload } from "@vercel/blob/client";
import { ChangeEventHandler, ReactNode, useCallback, useRef } from "react";
import { extractMetadata } from "./media/utils";
import { useToast } from "@/components/feedback/use-toast";

export const UploadMediaButton = ({
  children,
  slug,
}: {
  children: ReactNode;
  slug: string;
}) => {
  const inputFileRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const handleFileChange: ChangeEventHandler<HTMLInputElement> = async (
    event
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      const notif = toast({
        title: "Uploading...",
        description: "You upload has started",
      });
      const metadata = await extractMetadata(file);
      const newBlob = await upload(file.name, file, {
        access: "public",
        handleUploadUrl: `${window.location.origin}/recipe/${slug}/media`,
        clientPayload: JSON.stringify(metadata),
      });
      notif.update({
        id: notif.id,
        title: "Upload complete!",
        description: "Press to refresh the page.",
        action: <ToastAction altText="Try again">Refresh Page</ToastAction>,
      });
      console.log(newBlob.url);
    }
  };

  const handlePress = useCallback(async () => {
    inputFileRef.current?.click();
  }, [inputFileRef]);

  return (
    <>
      <input
        ref={inputFileRef}
        type="file"
        accept="image/*,video/*" // Accept only images and videos
        style={{ display: "none" }}
        onChange={handleFileChange}
      />
      <Button
        variant="outline"
        onClick={handlePress}
        aria-label="Take Photo"
        className="flex flex-row gap-1"
      >
        {children}
      </Button>
    </>
  );
};
