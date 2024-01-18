"use client";

import { useActor } from "@/hooks/useActor";
import { ChevronLeftIcon } from "lucide-react";
import { ReactNode, useContext, useRef } from "react";
import { useSwipeable } from "react-swipeable";
import { createMediaGalleryMachine } from "./machine";

import { AnimatedImage } from "@/components/animation/animated-image";
import { Button } from "@/components/input/button";
import HashLink from "@/components/navigation/hash-link";
import ScrollLockComponent from "@/components/scroll-lock";
import { useSelector, useSelectorSSR } from "@/hooks/useSelector";
import { useSend } from "@/hooks/useSend";
import { cn } from "@/lib/utils";
import { MediaFragmentLiteral } from "@/types";
import { useSearchParams } from "next/navigation";
import { createContext } from "react";
import { z } from "zod";
import { MediaGalleryActor } from "./machine";
import { selectImageHeight, selectIsFullscreen } from "./selectors";

const MediaGalleryContext = createContext({} as MediaGalleryActor);

export const MediaGalleryProvider = ({
  children,
  slug,
  minHeight, // index,
  media,
}: {
  children: ReactNode;
  slug: string;
  minHeight: string;
  media: { url: string; width: number; height: number }[];
  // index: number | undefined; // if no index, assumed to be the only one in the list
}) => {
  const searchParams = useSearchParams();

  const actor = useActor(`media-${slug}`, () =>
    createMediaGalleryMachine({
      slug,
      minHeight,
      media,
      focusedIndex: z
        .number()
        .parse(parseInt(searchParams.get("index") || "-1")),
    }).provide({
      actions: {
        replaceQueryParameters: ({ context }, params) => {
          const queryParams = new URLSearchParams(window.location.search);

          for (const key in params.paramSet) {
            const value = params.paramSet[key];
            if (!!value) {
              queryParams.set(key, value);
            } else {
              queryParams.delete(key);
            }
          }

          const paramString = queryParams.toString();

          // Construct the new URL
          const newUrl =
            paramString !== ""
              ? window.location.pathname + "?" + paramString
              : window.location.pathname;
          window.history.replaceState(context, "", newUrl);
        },
      },
    })
  );

  const fullscreen = useSelectorSSR(actor, selectIsFullscreen, false);

  const containerClasses = fullscreen
    ? "fixed inset-0 z-30 flex justify-center items-center bg-black flex flex-col scroll-auto"
    : "absolute top-0 w-screen left-1/2 transform -translate-x-1/2 flex z-10 justify-center";

  const Header = () => {
    return (
      <div className="flex-row max-w-7xl w-full mx-auto justify-start flex absolute top-0 p-4 z-50">
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

  const height = useSelectorSSR(
    actor,
    selectImageHeight,
    actor.getSnapshot().context.minHeight
  );

  // const handleTouchStart: TouchEventHandler<HTMLDivElement> = useCallback(
  //   (e) => {
  //     console.log("start", e);
  //   },
  //   []
  // );
  // const handleTouchMove: TouchEventHandler<HTMLDivElement> = useCallback(
  //   (e) => {
  //     console.log("move", e);
  //   },
  //   []
  // );
  // const handleTouchEnd: TouchEventHandler<HTMLDivElement> = useCallback((e) => {
  //   console.log("END!", e);
  // }, []);
  // const handlers = useSwipeable({
  //   onSwiped: (eventData) => console.log("User Swiped!", eventData),
  //   onTouchEndOrOnMouseUp:  () => {
  //     console.log("start")
  //   }
  //   // ...config,
  // });

  const send = useSend();
  const didSwipe = useRef(false);
  const startDir = useRef<string | null>(null);
  const handlers = useSwipeable({
    onSwipedDown: () => {
      send({ type: "SWIPE_DOWN" });
      didSwipe.current = true;
    },
    onSwipedUp: () => {
      send({ type: "SWIPE_UP" });
      didSwipe.current = true;
    },
    onSwipeStart: (e) => {
      startDir.current = e.dir;
      didSwipe.current = false;
    },
    // onTouchStartOrOnMouseDown: (e) => {
    //   // console.log("start", e);
    // },
    onTouchEndOrOnMouseUp: (e) => {
      const carouselEl = e.event.target as HTMLImageElement;
      carouselEl.style.translate = "0px 0px";
    },

    onSwiping: (e) => {
      const carouselEl = e.event.target as HTMLImageElement;
      const fullscreen = selectIsFullscreen(actor.getSnapshot());
      if (fullscreen) {
        if (startDir.current === "Up" || startDir.current === "Down") {
          carouselEl.style.translate = `0px ${e.deltaY}px`;
        }
      }
    },
  });

  return (
    <MediaGalleryContext.Provider value={actor}>
      <ScrollLockComponent active={fullscreen}>
        <div style={{ height }} className={cn(`w-full relative`)}>
          <div className={containerClasses}>
            {fullscreen && <Header />}
            <div
              {...handlers}
              // onTouchStart={handleTouchStart}
              // onTouchMove={handleTouchMove}
              // onTouchEnd={handleTouchEnd}
              className={cn(
                "carousel absolute z-40",
                !fullscreen ? `space-x-2 pr-8` : ``
              )}
              // style={{ scrollSnapType: "none", scrollBehavior: "auto" }}
              // ref={carouselRef}
              // {...carouselProps}
            >
              {!fullscreen && <div className="w-1 h-full carousel-item" />}
              {children}
            </div>
          </div>
        </div>
      </ScrollLockComponent>
    </MediaGalleryContext.Provider>
  );
};

export const MediaGalleryItem = ({
  // children,
  index,
}: {
  // children: ReactNode;
  index: number;
}) => {
  const actor = useContext(MediaGalleryContext);
  const slug = useSelector(actor, (state) => state.context.slug);
  const height = useSelectorSSR(
    actor,
    selectImageHeight,
    actor.getSnapshot().context.minHeight
  );
  const fullscreen = useSelectorSSR(actor, selectIsFullscreen, false);
  // const send = useSend();
  const ref = useRef<HTMLImageElement>(null);

  // const bind = useDrag(
  //   ({ swipe: [swipeX, swipeY], event }) => {
  //     event.stopPropagation();
  //     const el = ref.current;
  //     assert(el, "expected imageRef");

  //     if (swipeX !== 0) {
  //       if (swipeX > 0) {
  //         send({ type: "SWIPE_RIGHT" });
  //       } else {
  //         send({ type: "SWIPE_LEFT" });
  //       }
  //     }

  //     if (swipeY !== 0) {
  //       if (swipeY > 0) {
  //         send({ type: "SWIPE_DOWN" });
  //       } else {
  //         send({ type: "SWIPE_UP" });
  //       }
  //     }
  //   },
  //   {
  //     axis: "y",
  //     eventOptions: {
  //       capture: true,
  //     },
  //   }
  // );
  // const send = useSend();
  // const startDir = useRef<string | null>(null);
  // const didSwipe = useRef<boolean>(false);

  // // const props = fullscreen ? { ...bind() } : {};
  // const handlers = useSwipeable({
  //   onSwipedDown: () => {
  //     send({ type: "SWIPE_DOWN" });
  //     didSwipe.current = true;
  //   },
  //   onSwipedUp: () => {
  //     send({ type: "SWIPE_UP" });
  //     didSwipe.current = true;
  //   },
  //   onSwipeStart: (e) => {
  //     startDir.current = e.dir;
  //     didSwipe.current = false;
  //   },
  //   // onTouchStartOrOnMouseDown: (e) => {
  //   //   // console.log("start", e);
  //   // },
  //   onTouchEndOrOnMouseUp: (e) => {
  //     const imageEl = e.event.target as HTMLImageElement;
  //     imageEl.style.translate = "0px 0px";
  //   },

  //   onSwiping: (e) => {
  //     const imageEl = e.event.target as HTMLImageElement;
  //     const fullscreen = selectIsFullscreen(actor.getSnapshot());
  //     if (fullscreen) {
  //       if (startDir.current === "Up" || startDir.current === "Down") {
  //         imageEl.style.translate = `0px ${e.deltaY}px`;
  //       }
  //     }
  //   },
  // });

  const media = useSelector(actor, (state) => state.context.media[index]);

  if (!media) {
    console.warn("trying to rehder media that doesnt exist")
    return null;
  }

  return (
    <HashLink
      className={cn("carousel-item", fullscreen ? `w-full` : ``)}
      href={`#media-${slug}-${index}` satisfies MediaFragmentLiteral}
      style={{ height }}
      id={`media-${slug}-${index}`}
      ref={ref}
      // {...props}
    >
      <AnimatedImage
        // {...handlers}
        className={cn(
          `object-contain`,
          !fullscreen ? "w-auto rounded-box" : ` h-full w-full`
        )}
        style={{ height }}
        src={media.url}
        priority={index == 0}
        width={media.width}
        height={media.height}
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        alt={`Recipe Image #${index + 1}`}
      />
    </HashLink>
  );
};

export const MediaGalleryItems = async () => {
  const actor = useContext(MediaGalleryContext);
  const mediaList = useSelector(actor, (state) => state.context.media);

  return (
    <>
      {mediaList.map((media, index) => {
        return <MediaGalleryItem key={index} index={index} />;
      })}
    </>
  );
};
