"use client";

import { Card } from "@/components/display/card";
import { usePageSessionSelector } from "@/hooks/usePageSessionSelector";
import { createRecipeSelector, selectSelectedRecipeIds } from "@/selectors/page-session.selectors";
import { useMemo } from "react";
import { twc } from "react-twc";

const ShareDetailsRecipeCard = twc(Card)`w-36 h-24`;
const ShareDetailsRecipeTitle = twc.h4`line-clamp-3 font-semibold`;

export const ShareDetailsPreviewCarousel = () => {
  const selectedRecipeIds = usePageSessionSelector(selectSelectedRecipeIds);

  return (
    <div className="carousel carousel-center pl-4 pr-4 space-x-2 w-full">
      {selectedRecipeIds && selectedRecipeIds.map((id) => {
        return <ShareDetailsPreviewCarouselItem key={id} id={id} />;
      })}
    </div>
  );
};

const ShareDetailsPreviewCarouselItem = ({ id }: { id: string }) => {
  const selectRecipe = useMemo(() => createRecipeSelector(id), [id]);
  const recipe = usePageSessionSelector(selectRecipe);

  return (
    <div className="carousel-item">
      <ShareDetailsRecipeCard
        className="flex items-center justify-center p-2"
        variant="locontrast"
      >
        <ShareDetailsRecipeTitle>{recipe?.name}</ShareDetailsRecipeTitle>
      </ShareDetailsRecipeCard>
    </div>
  );
};
