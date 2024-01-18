"use client";

import { Button } from "@/components/input/button";
import { useSend } from "@/hooks/useSend";
import { ChangeEventHandler, ReactNode, useCallback, useRef } from "react";

export const UploadMediaButton = ({
  children,
  slug,
}: {
  children: ReactNode;
  slug: string;
}) => {
  const inputFileRef = useRef<HTMLInputElement>(null);
  const send = useSend();

  const handleFileChange: ChangeEventHandler<HTMLInputElement> = (event) => {
    const file = event.target.files?.[0];
    if (file) {
      send({ type: "FILE_SELECTED", file, slug });
      // const notif = toast({
      //   title: "Uploading...",
      //   description: "You upload has started",
      // });
      // var reader = new FileReader();
      // reader.onload = function (ev) {
      //   const newImageSrc = ev.target?.result;
      //   if (newImageSrc) {
      //     // do something here...
      //   }
      //   // console.log(ev.target?.result);

      //   // Set the src attribute of the image element to the data URL
      //   // console.log(e.target.result);
      // };
      // reader.readAsDataURL(file);

      // OPEN

      // const metadata = await extractMetadata(file);
      // // const newBlob = await upload(file.name, file, {
      // await upload(file.name, file, {
      //   access: "public",
      //   handleUploadUrl: `${window.location.origin}/recipe/${slug}/media`,
      //   clientPayload: JSON.stringify(metadata),
      // });
      // notif.update({
      //   id: notif.id,
      //   title: "Upload complete!",
      //   description: "Press to refresh the page.",
      //   open: true,
      //   // action: <ReloadAction />,
      // });
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
