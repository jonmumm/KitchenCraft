import { getSortedMediaForRecipe } from "@/db/queries";
import { MediaGalleryItem } from "./components.client";

export const MediaGalleryItems = async ({ slug }: { slug: string }) => {
  const mediaList = await getSortedMediaForRecipe(slug);

  return (
    <>
      {mediaList.map((media, index) => {
        return (
          <MediaGalleryItem
            key={index}
            index={index}
            slug={slug}
            media={media}
          />
        );
      })}
    </>
  );
};

export const MediaGalleryItemsPlaceholder = async () => {
  return <></>;
};
