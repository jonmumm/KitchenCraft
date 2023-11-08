import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getSlug } from "@/lib/slug";
import { noop, waitForStoreValue } from "@/lib/utils";
import { RecipeSchema, SubstitutionsPredictionInputSchema } from "@/schema";
import { ScaleRecipePredictionInput } from "@/types";
import { kv } from "@vercel/kv";
import { nanoid } from "ai";
import { ScaleIcon } from "lucide-react";
import { map } from "nanostores";
import { redirect } from "next/navigation";
import { ReactNode, Suspense } from "react";
import { z } from "zod";
import { RecipeContents } from "../recipe-contents";
import RecipeGenerator from "../recipe-generator";
import { StoreProps } from "../schema";

type Props = {
  params: { slug: string };
  searchParams: Record<string, string>;
};

export default async function Page(props: Props) {
  const { slug } = props.params;
  const prompt = z.string().min(1).parse(props.searchParams["prompt"]);
  if (!prompt) {
    return redirect(`/recipe/${{ slug }}`);
  }

  const recipeKey = `recipe:${slug}`;
  const recipe = RecipeSchema.parse(await kv.hgetall(recipeKey));

  const Generator = async () => {
    const input = {
      type: "SCALE_RECIPE",
      recipe: SubstitutionsPredictionInputSchema.shape.recipe.parse(recipe),
      scale: prompt,
    } satisfies ScaleRecipePredictionInput;
    return (
      <RecipeGenerator
        input={input}
        onProgress={(output) => {
          if (output.recipe) {
            store.setKey("recipe", {
              ...store.get().recipe,
              ...output.recipe,
            });
          }
        }}
        onError={(error, outputRaw) => {
          console.log("error", error, outputRaw);
          kv.hset(`recipe:${slug}`, {
            runStatus: "error",
            error,
            outputRaw,
          }).then(noop);
        }}
        onComplete={(output) => {
          console.log(output);
          store.setKey("recipe", {
            ...store.get().recipe,
            ...output.recipe,
          });
          //   kv.hset(`recipe:${slug}`, {
          //     runStatus: "done",
          //     ...output.recipe,
          //   }).then(noop);
          //   kv.zadd(`recipes:new`, {
          //     score: Date.now(),
          //     member: slug,
          //   }).then(() => {
          //     revalidatePath("/");
          //   });

          store.setKey("loading", false);
        }}
      />
    );
  };

  const id = nanoid();
  const store = map<StoreProps>({
    loading: true,
    recipe: {
      name: recipe.name,
      description: recipe.description,
      slug: getSlug({ id, name: recipe.name }),
      fromResult: recipe.fromResult,
      createdAt: new Date().toISOString(),
      runStatus: "initializing",
    },
  });

  const WaitForDoneLoading = async ({ children }: { children: ReactNode }) => {
    await waitForStoreValue(store, (state) => {
      if (!state.loading) {
        return null;
      }
    });
    return <>{children}</>;
  };

  const SaveCard = () => {
    const saveAsNewRecipe = async () => {
      "use server";
      console.log("SAVE! new");
    };
    const saveRecipe = async () => {
      "use server";
      console.log("SAVE!");
    };

    return (
      <Card className="flex flex-col gap-2 mx-3">
        <CardHeader className="flex flex-row gap-1 items-center justify-between w-full">
          <div className="flex flex-row gap-1">
            <ScaleIcon /> <span className="font-medium">Scaling...</span>
          </div>
          <div className="flex flex-row gap-1 flex-1 items-center justify-end">
            <Suspense fallback={<Skeleton className="w-20 h-10" />}>
              <WaitForDoneLoading>
                <form action={saveAsNewRecipe}>
                  <Button type="submit">Save As New Recipe</Button>
                </form>
              </WaitForDoneLoading>
            </Suspense>
            <Suspense fallback={<Skeleton className="w-14 h-10" />}>
              <WaitForDoneLoading>
                <form action={saveRecipe}>
                  <Button type="submit">Save Recipe</Button>
                </form>
              </WaitForDoneLoading>
            </Suspense>
          </div>
        </CardHeader>
      </Card>
    );
  };

  return (
    <div className="flex flex-col gap-2 max-w-2xl mx-auto px-4 my-3">
      <SaveCard />
      <Card className="flex flex-col gap-2 pb-5 mx-3">
        <Suspense fallback={null}>
          <Generator />
        </Suspense>
        <RecipeContents store={store} {...recipe} />
      </Card>
    </div>
  );
}
