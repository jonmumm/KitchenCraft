import { usePageSessionSelector } from "@/hooks/usePageSessionSelector";
import { TagIcon } from "lucide-react";
import { Badge } from "./display/badge";
import { Skeleton } from "./display/skeleton";

export const Tags = ({ recipeId }: { recipeId?: string }) => {
  const isComplete = usePageSessionSelector((state) =>
    recipeId ? state.context.recipes?.[recipeId]?.complete : undefined
  );
  const numTags = usePageSessionSelector((state) =>
    recipeId ? state.context.recipes?.[recipeId]?.tags?.length || 0 : 0
  );
  const items = new Array(!isComplete ? Math.max(numTags, 3) : numTags).fill(0);

  const Tag = (props: { index: number }) => {
    // const session$ = usePageSessionStore();
    // const session = useStore(session$);
    // const recipeId = session.context.suggestedRecipes[index];
    // if (!recipeId || !session.context.recipes[recipeId]) {
    //   return (
    //     <Badge variant="outline" className="inline-flex flex-row gap-1 px-2">
    //       <Skeleton className="w-8 h-4" />
    //     </Badge>
    //   );
    // }
    const tag = usePageSessionSelector((state) =>
      recipeId
        ? state.context.recipes?.[recipeId]?.tags?.[props.index]
        : undefined
    );
    if (!tag) {
      return (
        <Badge variant="outline" className="inline-flex flex-row gap-1 px-2">
          <Skeleton className="w-8 h-4" />
        </Badge>
      );
    }
    return (
      <>
        {tag ? (
          //   <Link href={`/tag/${sentenceToSlug(tag)}`}>
          <Badge variant="outline" className="inline-flex flex-row gap-1 px-2">
            {tag}
          </Badge>
        ) : //   </Link>
        null}
      </>
    );
  };

  return (
    <div className="flex flex-row flex-wrap gap-2 px-5 px-y hidden-print items-center justify-center">
      <TagIcon size={16} className="h-5" />
      {items.map((_, ind) => {
        return <Tag key={ind} index={ind} />;
      })}
      {/* <AddTagButton /> */}
    </div>
  );
};
