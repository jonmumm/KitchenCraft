import { Button } from "@/components/ui/button";
import RecipeLabel from "@/components/ui/recipe-label";
import { AxeIcon, ChevronRightIcon } from "lucide-react";

export default function SuggestionResult({
  name,
  description,
}: {
  name: string;
  description: string;
}) {
  return (
    <div className="p-2 flex flex-row gap-4 items-center">
      <div>
        <Button size="icon" variant="outline">
          <AxeIcon />
        </Button>
      </div>
      <RecipeLabel name={name} description={description} />
      <div>
        <Button size="icon" variant="ghost">
          <ChevronRightIcon />
        </Button>
      </div>
    </div>
  );
}
