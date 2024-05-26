import { usePageSessionSelector } from "@/hooks/usePageSessionSelector";
import { SkeletonSentence } from "./display/skeleton";

export function Ingredients({ recipeId }: { recipeId?: string }) {
  const NUM_LINE_PLACEHOLDERS = 5;

  const ingredientsComplete = usePageSessionSelector((state) =>
    recipeId
      ? state.context.recipes?.[recipeId]?.instructions?.length
      : undefined
  );
  const numIngredients = usePageSessionSelector((state) =>
    recipeId ? state.context.recipes?.[recipeId]?.ingredients?.length || 0 : 0
  );
  const items = new Array(
    !ingredientsComplete
      ? Math.max(numIngredients, NUM_LINE_PLACEHOLDERS)
      : numIngredients
  ).fill(0);

  const Item = (props: { index: number }) => {
    const ingredient = usePageSessionSelector((state) =>
      recipeId ? state.context.recipes?.[recipeId]?.ingredients?.[props.index] : undefined
    );
    const showPlaceholder = props.index < NUM_LINE_PLACEHOLDERS;
    if (!ingredient) {
      return showPlaceholder ? (
        <SkeletonSentence
          className="h-7"
          numWords={Math.round(Math.random()) + 3}
        />
      ) : null;
    }

    return <li>{ingredient}</li>;
  };

  return (
    <>
      {items.map((_, index) => {
        return <Item key={index} index={index} />;
      })}
    </>
  );
}
