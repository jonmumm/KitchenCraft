import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { waitForStoreValue } from "@/lib/utils";
import { TagIcon } from "lucide-react";
import { MapStore } from "nanostores";
import { Suspense } from "react";
import { AddTagButton } from "./add-tag-button";
import { StoreProps } from "./schema";

export const Tags = ({ store }: { store: MapStore<StoreProps> }) => {
  const items = new Array(3).fill(0);

  const Tag = async ({ index }: { index: number }) => {
    const tag = await waitForStoreValue(
      store,
      ({ recipe: { tags, ingredients } }) => {
        if (!tags) {
          return;
        }

        const ingredientsExist = !!ingredients;
        const nextTagExists = !!tags[index + 1];

        const doneLoading = nextTagExists || ingredientsExist;

        if (doneLoading) {
          const tag = tags[index];
          return tag ? tag : null;
        }
      }
    );
    return (
      <>
        {tag ? (
          <Badge variant="outline" className="inline-flex flex-row gap-1 px-2">
            {tag}
          </Badge>
        ) : null}
      </>
    );
  };

  return (
    <div className="flex flex-row flex-wrap gap-2 px-5 px-y hidden-print items-center justify-center">
      <TagIcon className="h-5" />
      {items.map((_, index) => {
        return (
          <Suspense
            key={`tag-${index}`}
            fallback={<Skeleton className="w-14 h-4" />}
          >
            <Tag index={index} />
          </Suspense>
        );
      })}
      <AddTagButton />
    </div>
  );
};
