import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/components/ui/card";
import { Command, CommandGroup, CommandList } from "@/components/ui/command";
import { RecipeSchema } from "@/schema";
import { kv } from "@vercel/kv";
import { useCommandState } from "cmdk";
import { ShuffleIcon } from "lucide-react";
import { z } from "zod";

type Props = {
  params: { slug: string };
  searchParams: Record<string, string>;
};

const RemixActionSchema = z.enum([
  "missing",
  "dietary",
  "equipment",
  "servings",
]);

export default async function Page(props: Props) {
  const { slug } = props.params;
  // useCommandState((state) => state.)

  const action = RemixActionSchema.parse(props.searchParams["action"]);
  const recipeKey = `recipe:${slug}`;

  const recipe = RecipeSchema.parse(await kv.hgetall(recipeKey));

  //   const handleSubmitForm = (formData: FormData) => {
  //     "use server";
  //   };
  console.log({ action, recipe });

  return (
    <div className="flex flex-col gap-2 max-w-2xl mx-auto px-4">
      <Card>
        <Command shouldFilter={false}>
          <CardHeader className="items-start">
            <div className="flex flex-row gap-3 items-center">
              <ShuffleIcon />
              <div className="flex flex-col gap-1">
                <CardDescription>
                  Remixing <span className="font-semibold">{recipe.name}</span>
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="round-md p-0">
            <div className="w-full">
              <form>
                {/* <CraftInput
                  // onValueChange={changeAction}
                  defaultValue={prompt}
                /> */}
              </form>
            </div>
            <CommandList className="p-3 max-h-100">
              <CommandGroup heading="Ideas">
                {/* <RemixIdeas slug={slug} /> */}
              </CommandGroup>
              {/* {remixSrc && resultType === "remix" && (
                  <Suspense fallback={<RemixResultsLoader />}>
                    <RemixResults srcSlug={remixSrc} prompt={prompt} />
                  </Suspense>
                )} */}
              {/* <RecentPrompts /> */}
              {/* {resultType === "suggestions" && <RecipeSuggestions />} */}
              {/* <ConjureAction /> */}
            </CommandList>
          </CardContent>
        </Command>
      </Card>
    </div>
  );
}
