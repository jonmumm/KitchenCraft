"use client";

import { useActor } from "@/hooks/useActor";
import { ChevronLeftIcon } from "lucide-react";
import Image from "next/image";
import { ReactNode, useContext, useRef } from "react";
import { createMediaGalleryMachine } from "./machine";

import { Button } from "@/components/input/button";
import HashLink from "@/components/navigation/hash-link";
import ScrollLockComponent from "@/components/scroll-lock";
import { useSelector } from "@/hooks/useSelector";
import { useSend } from "@/hooks/useSend";
import { cn } from "@/lib/utils";
import { MediaFragmentLiteral } from "@/types";
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
  numItems,
}: {
  children: ReactNode;
  slug: string;
  minHeight: string;
  numItems: number;
  // index: number | undefined; // if no index, assumed to be the only one in the list
}) => {
  const searchParams = useSearchParams();

  const actor = useActor(`media-${slug}`, () =>
    createMediaGalleryMachine({
      slug,
      minHeight,
      numItems,
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

  // useEffect(() => {
  //   console.log(window.location.hash);
  //   // actor.send({type: })
  // }, []);

  const fullscreen = useSelector(actor, selectIsFullscreen);

  const containerClasses = fullscreen
    ? "fixed inset-0 z-50 flex justify-center items-center bg-black flex flex-col"
    : "absolute top-0 w-screen left-1/2 transform -translate-x-1/2 flex z-10 justify-center";

  const Header = () => {
    return (
      <div className="flex-row max-w-7xl w-full mx-auto justify-start flex absolute top-0 p-4">
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
  // const send = useSend();
  // const carouselRef = useRef<HTMLDivElement>(null);

  // const scrollLeftRef = useRef<number | null>(null);

  // const bind = useDrag(
  //   ({ swipe: [swipeX, swipeY], event, down, movement, delta }) => {
  //     event.stopPropagation();
  //     const { slug, focusedIndex } = actor.getSnapshot().context;
  //     const [mx, my] = movement;
  //     console.log(mx, down);

  //     if (swipeY !== 0) {
  //       const mediaEl = document.getElementById(
  //         `media-${slug}-${focusedIndex}`
  //       );

  //       if (mediaEl) {
  //         const imgEl = mediaEl.children[0] as HTMLImageElement | undefined;
  //         if (imgEl) {
  //           imgEl.style.translate = "0px";
  //         }
  //       }
  //       if (swipeY > 0) {
  //         send({ type: "SWIPE_DOWN" });
  //       } else {
  //         send({ type: "SWIPE_UP" });
  //       }
  //       return;
  //     }

  //     if (swipeX !== 0) {
  //       // TODO how do we go to  from the current translate
  //       // to the next item

  //       if (swipeY > 0) {
  //         send({ type: "SWIPE_LEFT" });
  //       } else {
  //         send({ type: "SWIPE_RIGHT" });
  //       }
  //       scrollLeftRef.current = null;
  //       return;
  //     }

  //     if (mx) {
  //       const carouselEl = carouselRef.current;

  //       if (carouselEl && scrollLeftRef.current === null) {
  //         scrollLeftRef.current = carouselEl.scrollLeft;
  //       }

  //       if (carouselEl) {
  //         if (down) {
  //           carouselEl.scrollLeft = -mx;
  //         } else if (scrollLeftRef.current !== null) {
  //           carouselEl.scrollLeft = scrollLeftRef.current; // todo
  //           scrollLeftRef.current = null;
  //         }
  //       }
  //     } else if (my) {
  //       const mediaEl = document.getElementById(
  //         `media-${slug}-${focusedIndex}`
  //       );

  //       if (mediaEl) {
  //         const imgEl = mediaEl.children[0] as HTMLImageElement | undefined;
  //         if (imgEl) {
  //           if (down) {
  //             imgEl.style.translate = `0px ${my}px`;
  //           } else {
  //             imgEl.style.translate = "0px";
  //           }
  //         }
  //         // todo change the horizontaol scroll psotiionmanulaly here
  //         // of carouselEl
  //         // Calculate the new horizontal scroll position
  //         // console.log(carouselEl.scrollLeft, movement);
  //         // const newScrollPosition = carouselEl.scrollLeft + -mx;

  //         // Update the carousel's scroll position
  //       }
  //     }
  //   },
  //   {
  //     axis: "lock",
  //     eventOptions: {
  //       capture: true,
  //     },
  //   }
  // );

  // const carouselProps = fullscreen ? { ...bind() } : {};

  return (
    <MediaGalleryContext.Provider value={actor}>
      <ScrollLockComponent active={fullscreen}>
        <div style={{ height }} className={cn(`w-full relative`)}>
          <div className={containerClasses}>
            {fullscreen && <Header />}
            <div
              className={cn(
                "carousel absolute",
                !fullscreen ? `space-x-2 pr-8 carousel` : ``
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

  // const props = fullscreen ? { ...bind() } : {};

  return (
    <HashLink
      className={cn("carousel-item", fullscreen ? `w-full` : ``)}
      href={`#media-${slug}-${index}` satisfies MediaFragmentLiteral}
      style={{ height }}
      id={`media-${slug}-${index}`}
      ref={ref}
      // {...props}
    >
      <Image
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
