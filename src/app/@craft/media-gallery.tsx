// "use client";

// import { useCallback, useMemo } from "react";
// import { MediaGalleryProvider, MediaGallery as BaseMediaGallery, MediaGalleryContainer, MediaGalleryItems } from "../../modules/media-gallery/components.client";
// import { useSelector } from "@/hooks/useSelector";
// import { getSortedMediaForRecipe } from "@/db/queries";

// export const MediaGallery = ({ recipeId, mediaIds }: { recipeId: string; mediaIds?: string[] }) => {
//   const allMedia = useSelector(getSortedMediaForRecipe, recipeId);

//   const filteredMedia = useMemo(() => {
//     if (!mediaIds) return allMedia;
//     return allMedia.filter(media => mediaIds.includes(media.id));
//   }, [allMedia, mediaIds]);

//   const minHeight = "50vh"; // You can adjust this value as needed

//   return (
//     <MediaGalleryProvider slug={recipeId} minHeight={minHeight} media={filteredMedia}>
//       <MediaGalleryContainer>
//         <BaseMediaGallery>
//           <MediaGalleryItems />
//         </BaseMediaGallery>
//       </MediaGalleryContainer>
//     </MediaGalleryProvider>
//   );
// };
