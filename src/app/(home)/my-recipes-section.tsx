import { Badge } from "@/components/display/badge";
import { MyRecipeLists } from "@/components/my-recipe-lists";
import { MoveRightIcon } from "lucide-react";
import Link from "next/link";

export const MyRecipesSection = () => {
  return (
    <>
      <div className="px-4 mt-8 max-w-3xl w-full mx-auto flex flex-row justify-between items-center mb-2">
        <h3 className="text-md font-semibold">My Recipes</h3>
        {/* <Link href="/my-recipes">
          <Badge variant="outline">
            View All
            <MoveRightIcon className="ml-1" size={14} />
          </Badge>
        </Link> */}
      </div>
      <div>
        <MyRecipeLists />
      </div>
    </>
  );
};
