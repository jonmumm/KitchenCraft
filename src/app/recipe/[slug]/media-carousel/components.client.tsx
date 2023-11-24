"use client";

import { Header } from "@/app/header";
import Image from "next/image";
import { UploadedMedia } from "../media/types";

export const MediaCarousel = ({
  previewMedia,
}: {
  previewMedia: UploadedMedia[];
}) => {
  const mainMedia = previewMedia[0];
  if (!mainMedia) {
    console.error("Expected media but not found");
    return null;
  }

  return (
    <div className="w-full aspect-square overflow-hidden relative rounded-b-xl shadow-md">
      <Header className="absolute left-0 right-0 top-0" />
      <Image
        src={mainMedia.url}
        priority
        width={mainMedia.metadata.width}
        height={mainMedia.metadata.width}
        sizes="100vw"
        alt="Main media"
        style={{ objectFit: "contain" }}
      />
    </div>
  );
};
