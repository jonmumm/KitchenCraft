import { RecipeListItemLoading } from "@/app/recipe/components";

import { Card } from "@/components/display/card";
import { slugToSentence } from "@/lib/utils";
import { TagIcon } from "lucide-react";
import { Skeleton } from "@/components/display/skeleton";
import { TagsCarouselPlaceholder } from "@/components/modules/tags-carousel";
import { Separator } from "@/components/display/separator";

export default function Loading(props: { params: { tagSlug: string } }) {

  return (
    <div className="flex flex-col">
      <TagsCarouselPlaceholder />
      <Separator />
      <div className="w-full flex flex-col gap-4">
        <div className="flex flex-col sm:gap-10 mt-0 sm:mt-10">
          {new Array(8).fill(0).map((_, index) => {
            return <RecipeListItemLoading key={index} index={index} />;
          })}
        </div>
      </div>
    </div>
  );
}
