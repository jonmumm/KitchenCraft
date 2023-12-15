import { RecipeListItemLoading } from "@/app/recipe/components";

import { Card } from "@/components/display/card";
import { slugToSentence } from "@/lib/utils";
import { TagIcon } from "lucide-react";
import { Skeleton } from "@/components/display/skeleton";

export default function Loading(props: { params: { tagSlug: string } }) {

  return (
    <div className="flex flex-col">
      <div className="w-full max-w-2xl mx-auto p-4">
        <Card className="py-2">
          <div className="flex flex-col gap-2">
            <div className="flex flex-row gap-1 items-center px-2">
              <div className="px-4">
                <TagIcon />
              </div>
              <div className="flex flex-col gap-1">
                <h1 className="underline font-bold text-xl"><Skeleton className="w-28 h-6" /></h1>
              </div>
            </div>
          </div>
        </Card>
      </div>
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
