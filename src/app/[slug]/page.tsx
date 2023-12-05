import { Badge } from "@/components/display/badge";
import { Card } from "@/components/display/card";
import { getRecentRecipesByProfile } from "@/db/queries/queries";
import { ProfileSlugSchema } from "@/schema";
import { ChefHatIcon } from "lucide-react";
import { Header } from "../header";
import { RecipeListItem } from "../recipe/components";

export default async function Page(props: { params: { slug: string } }) {
  const slug = decodeURIComponent(props.params.slug);

  const profileParse = ProfileSlugSchema.safeParse(slug);
  if (profileParse.success) {
    const username = profileParse.data;

    // Fetch recent recipes by profile
    const recipes = await getRecentRecipesByProfile(slug);

    return (
      <div className="flex flex-col">
        <div className="max-w-2xl w-full mx-auto">
          <Header />
        </div>

        <div className="w-full max-w-2xl mx-auto p-4">
          <Card className="py-2">
            <div className="flex flex-col gap-2">
              <div className="flex flex-row gap-1 items-center px-2">
                <div className="px-4">
                  <ChefHatIcon />
                </div>
                <div className="flex flex-col gap-1">
                  <h1 className="underline font-bold text-xl">{username}</h1>
                  <span className="font-medium text-sm">(+123 🧪)</span>
                </div>
                <div className="flex-1 flex flex-col h-full gap-1 justify-start items-end">
                  <Badge variant="outline">Joined Dec '23</Badge>
                </div>
              </div>
            </div>
          </Card>
        </div>
        <div className="w-full flex flex-col gap-4">
          {/* Display the recipes using RecipeListItem */}
          <div className="flex flex-col gap-12">
            {recipes.map((recipe, index) => (
              <RecipeListItem key={recipe.slug} index={index} recipe={recipe} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return <div>Not Found</div>;
}
