import { usePageSessionSelector } from "@/hooks/usePageSessionSelector";
import { SkeletonSentence } from "./display/skeleton";

export function Instructions({ recipeId }: { recipeId?: string }) {
  const NUM_LINE_PLACEHOLDERS = 5;
  const numInstructions = usePageSessionSelector((state) =>
    recipeId ? state.context.recipes?.[recipeId]?.instructions?.length || 0 : 0
  );
  const isComplete = usePageSessionSelector((state) =>
    recipeId ? state.context.recipes?.[recipeId]?.complete : undefined
  );
  const items = new Array(
    !isComplete
      ? Math.max(numInstructions, NUM_LINE_PLACEHOLDERS)
      : numInstructions
  ).fill(0);

  const Item = (props: { index: number }) => {
    const showPlaceholder = props.index < NUM_LINE_PLACEHOLDERS;
    const instruction = usePageSessionSelector((state) =>
      recipeId
        ? state.context.recipes?.[recipeId]?.instructions?.[props.index]
        : undefined
    );
    if (!instruction) {
      return showPlaceholder ? (
        <SkeletonSentence
          className="h-7"
          numWords={Math.round(Math.random()) + 3}
        />
      ) : null;
    }

    return <li>{instruction}</li>;
  };

  return (
    <>
      {items.map((_, index) => {
        return <Item key={index} index={index} />;
      })}
    </>
  );
}
