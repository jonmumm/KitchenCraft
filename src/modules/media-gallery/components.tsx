import { getSortedMediaForRecipe } from "@/db/queries";
import { ReactNode } from "react";
import { MediaGalleryRoot } from "./components.client";

export const MediaGalleryProvider = async ({
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
    <MediaGalleryRoot slug={slug} minHeight={minHeight} media={media}>
      {children}
    </MediaGalleryRoot>
  );
};

export const MediaGalleryItemsPlaceholder = async () => {
  return <></>;
};
