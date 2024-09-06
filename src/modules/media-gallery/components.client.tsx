"use client";

import ScrollLockComponent from "@/components/scroll-lock";
import { cn } from "@/lib/utils";
import { createContext, useState } from "react";
import { MediaGalleryActor } from "./machine";

import useEmblaCarousel from "embla-carousel-react";

export const MediaGalleryContext = createContext({} as MediaGalleryActor);

// export const MediaGalleryRoot = ({
//   children,
//   slug,
//   minHeight, // index,
//   media,
// }: {
//   children: ReactNode;
//   slug: string;
//   minHeight: string;
//   media: { url: string; width: number; height: number }[];
//   // index: number | undefined; // if no index, assumed to be the only one in the list
// }) => {
//   const searchParams = useSearchParams();

//   const actor = useActor(`media-${slug}`, () =>
//     createMediaGalleryMachine({
//       slug,
//       minHeight,
//       media,
//       focusedIndex: z
//         .number()
//         .parse(parseInt(searchParams.get("index") || "-1")),
//     }).provide({
//       actions: {
//         replaceQueryParameters: ({ context }, params) => {
//           const queryParams = new URLSearchParams(window.location.search);

//           for (const key in params.paramSet) {
//             const value = params.paramSet[key];
//             if (!!value) {
//               queryParams.set(key, value);
//             } else {
//               queryParams.delete(key);
//             }
//           }

//           const paramString = queryParams.toString();

//           // Construct the new URL
//           const newUrl =
//             paramString !== ""
//               ? window.location.pathname + "?" + paramString
//               : window.location.pathname;
//           window.history.replaceState(context, "", newUrl);
//         },
//       },
//     })
//   );

//   // const handleTouchStart: TouchEventHandler<HTMLDivElement> = useCallback(
//   //   (e) => {
//   //     console.log("start", e);
//   //   },
//   //   []
//   // );
//   // const handleTouchMove: TouchEventHandler<HTMLDivElement> = useCallback(
//   //   (e) => {
//   //     console.log("move", e);
//   //   },
//   //   []
//   // );
//   // const handleTouchEnd: TouchEventHandler<HTMLDivElement> = useCallback((e) => {
//   //   console.log("END!", e);
//   // }, []);
//   // const handlers = useSwipeable({
//   //   onSwiped: (eventData) => console.log("User Swiped!", eventData),
//   //   onTouchEndOrOnMouseUp:  () => {
//   //     console.log("start")
//   //   }
//   //   // ...config,
//   // });

//   return (
//     <MediaGalleryContext.Provider value={actor}>
//       {children}
//     </MediaGalleryContext.Provider>
//   );
// };

export const MediaGallery = ({
  recipeId,
  initialMediaIds,
  minHeight = "20dvh",
}: {
  recipeId: string;
  initialMediaIds: string[];
  minHeight?: string;
}) => {
  const [emblaRef] = useEmblaCarousel({ loop: false });
  const [mediaIds] = useState(["1", "2", "3", "4"]);
  const fullscreen = false; // You can implement fullscreen logic later if needed

  return (
    <ScrollLockComponent active={fullscreen}>
      {mediaIds.length > 0 && (
        <div className={cn(`w-full relative`)} style={{ height: minHeight }}>
          <div className="embla max-w-[100vw] mx-auto" ref={emblaRef}>
            <div className="embla__container touch-pan-x flex">
              {mediaIds.map((id, index) => (
                <div key={id} className="embla__slide flex-none min-w-0 max-w-full bg-primary">
                  <MediaGalleryItem mediaId={id} index={index} />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </ScrollLockComponent>
  );
};

const MediaGalleryItem = ({
  mediaId,
  index,
}: {
  mediaId: string;
  index: number;
}) => {
  return (
    <div className="relative w-full h-full">
      <div className="w-full h-full rounded-lg bg-purple-300" />
    </div>
  );
};

// export const MediaGalleryContainer = ({
//   children,
// }: {
//   children: ReactNode;
// }) => {
//   const actor = useContext(MediaGalleryContext);
//   const mediaCount = useSelector(actor, (state) => state.context.media.length);

//   return (
//     <div className={cn(mediaCount > 0 ? "h-[50vh]" : "hidden", "relative")}>
//       {children}
//     </div>
//   );
// };
