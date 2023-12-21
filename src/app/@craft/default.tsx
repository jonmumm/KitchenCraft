import { Label } from "@/components/display/label";
import { InstantRecipeItem, SuggestionItem } from "./components.client";

export default function Page({
  searchParams,
}: {
  searchParams: Record<string, string>;
}) {
  const items = new Array(6).fill(0);

  return (
    <div className="max-w-3xl w-full mx-auto flex flex-col gap-2 px-4 h-full">
      <Label className="text-xs text-muted-foreground uppercase font-semibold">
        Top Hit
      </Label>
      <InstantRecipeItem />
      <Label className="text-xs text-muted-foreground uppercase font-semibold mt-4">
        Suggestions
      </Label>
      {items.map((_, index) => {
        return <SuggestionItem key={index} index={index} />;
      })}
    </div>
  );
}
