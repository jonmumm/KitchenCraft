"use client";

import { CloudflareImage } from "@/components/cloudflare-image";
import { cn } from "@/lib/utils";
import { createContext, useState } from "react";
import { MediaGalleryActor } from "./machine";

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

export const MediaPreview = ({
  recipeId,
  initialMediaIds, // height = "20dvh",
}: {
  recipeId: string;
  initialMediaIds: string[];
  // height?: string;
}) => {
  const [mediaIds] = useState(initialMediaIds);
  const fullscreen = false; // You can implement fullscreen logic later if needed
  console.log("mediaIds", mediaIds);

  const previewMediaId = mediaIds[0];

  return (
    <>
      {previewMediaId && (
        <div className={cn(`relative w-full aspect-square`)}>
          <div className="mx-auto h-full">
            <div className="flex h-full">
              <div className="h-full aspect-square rounded-xl">
                <CloudflareImage
                  mediaId={previewMediaId}
                  width={1000}
                  height={1000}
                  fit="cover"
                  alt="Recipe Preview"
                  className="h-full w-full"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
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
