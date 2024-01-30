import { Card } from "@/components/display/card";
import { Button } from "@/components/input/button";
import { getSession } from "@/lib/auth/session";
import { ChevronsRightIcon, XIcon } from "lucide-react";
import { getHotRecipes } from "../../db/queries";
import { RecipeListItem } from "../recipe/components";
import Link from "next/link";

// export const dynamic = "force-dynamic";
export default async function Page() {
  const items = new Array(30).fill(0);
  const session = await getSession();
  const userId = session?.user.id;
  const recipes = await getHotRecipes(session?.user.id);

  return (
    <div className="flex flex-col sm:gap-10 mt-0 sm:mt-10">
      <Card className="mx-auto max-w-md w-full p-4 rounded-2xl flex flex-col gap-3">
        <div className="flex flex-row justify-between w-full items-center">
          <h3 className="text-xl font-semibold">🙋First Timer?</h3>
          <Button variant="outline" size="icon">
            <XIcon />
          </Button>
        </div>
        <p className="opacity-70 text-med">
          Get started with KitchenCraft to instantly create personalized
          recipes.
        </p>
        <Link className="flex flex-row justify-end" href="/quick-start">
          <Button>
            Quick Start <ChevronsRightIcon className="ml-1" size={16} />
          </Button>
        </Link>
      </Card>
      {items.map((_, index) => {
        const recipe = recipes[index];

        if (!recipe) {
          return null;
        }

        return (
          <RecipeListItem
            key={index}
            index={index}
            recipe={recipe}
            userId={userId}
          />
        );
      })}
    </div>
  );
}
