import { getSortedMediaForRecipe } from "@/db/queries";
import { ReactNode } from "react";
import { MediaGalleryItem, MediaGalleryProvider } from "./components.client";

export const MediaGallery = async ({
  slug,
  minHeight,
  children,
}: {
  slug: string;
  minHeight: string;
  children: ReactNode;
}) => {
  const media = await getSortedMediaForRecipe(slug);

  return (
    <MediaGalleryProvider slug={slug} minHeight={minHeight} media={media}>
      {children}
    </MediaGalleryProvider>
  );
};


export const MediaGalleryItemsPlaceholder = async () => {
  return <></>;
};
