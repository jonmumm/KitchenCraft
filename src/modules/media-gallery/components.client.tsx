"use client";

import { useActor } from "@/hooks/useActor";
import { ChevronLeftIcon } from "lucide-react";
import Image from "next/image";
import { ReactNode, useContext } from "react";
import { createMediaGalleryMachine } from "./machine";

import { Button } from "@/components/input/button";
import EventTrigger from "@/components/input/event-trigger";
import { useScrollLock } from "@/components/scroll-lock";
import { useSelector } from "@/hooks/useSelector";
import { cn } from "@/lib/utils";
import { useSearchParams } from "next/navigation";
import { createContext } from "react";
import { z } from "zod";
import { MediaGalleryActor } from "./machine";
import { selectImageHeight, selectIsFullscreen } from "./selectors";

const MediaGalleryContext = createContext({} as MediaGalleryActor);

export const MediaGallery = ({
  children,
  slug,
  minHeight, // index,
}: {
  children: ReactNode;
  slug: string;
  minHeight: string;
  // index: number | undefined; // if no index, assumed to be the only one in the list
}) => {
  const searchParams = useSearchParams();

  const actor = useActor(`media-${slug}`, () =>
    createMediaGalleryMachine({
      fullscreen: false,
      slug,
      minHeight,
      focusedIndex: z
        .number()
        .parse(parseInt(searchParams.get("index") || "-1")),
    })
  );
  const fullscreen = useSelector(actor, selectIsFullscreen);

  const containerClasses = fullscreen
    ? "fixed inset-0 z-50 flex justify-center items-center bg-black flex flex-col"
    : "absolute top-0 w-screen left-1/2 transform -translate-x-1/2 flex z-10 justify-center";

  const Header = () => {
    useScrollLock(true);

    return (
      <div className="flex-row max-w-7xl w-full mx-auto justify-start flex absolute top-0">
        <Button
          event={{ type: "BACK" }}
          size="icon"
          variant="outline"
          className="invert"
        >
          <ChevronLeftIcon />
        </Button>
      </div>
    );
  };

  const height = useSelector(actor, selectImageHeight);

  return (
    <MediaGalleryContext.Provider value={actor}>
      <div style={{ height }} className={cn(`w-full relative`)}>
        <div className={containerClasses}>
          {fullscreen && <Header />}
          <div
            className={cn(
              "carousel absolute",
              !fullscreen ? `space-x-2 pr-8` : ``
            )}
          >
            {!fullscreen && <div className="w-1 h-full carousel-item" />}
            {children}
          </div>
        </div>
      </div>
    </MediaGalleryContext.Provider>
  );
};

export const MediaGalleryItem = ({
  // children,
  media,
  slug,
  index,
}: {
  // children: ReactNode;
  slug: string;
  index: number;
  media: { id: string; width: number; height: number; url: string };
}) => {
  const actor = useContext(MediaGalleryContext);
  const height = useSelector(actor, selectImageHeight);
  const fullscreen = useSelector(actor, selectIsFullscreen);

  return (
    <EventTrigger
      className={cn("carousel-item", fullscreen ? `w-full` : ``)}
      style={{ height }}
      id={`media-${index}`}
      key={media.id}
      event={{
        type: "PRESS_MEDIA_THUMB",
        slug,
        index,
      }}
    >
      <Image
        className={cn(
          `rounded-box object-contain`,
          !fullscreen ? "w-auto " : ` h-full w-full`
        )}
        style={{ height }}
        src={media.url}
        priority={index == 0}
        width={media.width}
        height={media.height}
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        alt={`Recipe Image #${index + 1}`}
      />
    </EventTrigger>
  );
};
