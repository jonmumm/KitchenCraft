import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { FloatingDock } from "@/components/ui/floating-dock";
import { WaitForStore } from "@/components/wait-for-store";
import { getSlug } from "@/lib/slug";
import {
  CompletedRecipeSchema,
  ModificationSchema,
  ModifyRecipeDietaryPredictionInputSchema,
  ModifyRecipeEquipmentPredictionInputSchema,
  ModifyRecipeIngredientsPredictionInputSchema,
  ModifyRecipeScalePredictionInputSchema,
} from "@/schema";
import {
  ModifyRecipeDietaryPredictionInput,
  ModifyRecipeEquipmentPredictionInput,
  ModifyRecipeIngredientsPredictionInput,
  ModifyRecipeScalePredictionInput,
} from "@/types";
import { kv } from "@vercel/kv";
import { nanoid } from "ai";
import { ArrowRightLeftIcon } from "lucide-react";
import { map } from "nanostores";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { z } from "zod";
import { RecipeContents } from "../recipe-contents";
import RecipeGenerator from "../recipe-generator";
import { StoreProps } from "../schema";

type Props = {
  params: { slug: string };
  searchParams: Record<string, string>;
};

export default async function Page(props: Props) {
  const baseSlug = props.params.slug;

  let prompt: string;
  let modification: string;
  try {
    prompt = z.string().min(1).parse(props.searchParams["prompt"]);
    modification = ModificationSchema.parse(props.searchParams["modification"]);
  } catch (ex) {
    return redirect(`/recipe/${baseSlug}`);
  }

  const recipeKey = `recipe:${baseSlug}`;
  const recipe = CompletedRecipeSchema.parse(await kv.hgetall(recipeKey));

  const id = nanoid();
  const branchedSlug = getSlug({ id, name: recipe.name });

  const Generator = async () => {
    const getInput = () => {
      switch (modification) {
        case "substitute":
          return {
            type: "MODIFY_RECIPE_INGREDIENTS",
            recipe:
              ModifyRecipeIngredientsPredictionInputSchema.shape.recipe.parse(
                recipe
              ),
            prompt,
          } satisfies ModifyRecipeIngredientsPredictionInput;
        case "dietary":
          return {
            type: "MODIFY_RECIPE_DIETARY",
            recipe:
              ModifyRecipeDietaryPredictionInputSchema.shape.recipe.parse(
                recipe
              ),
            prompt,
          } satisfies ModifyRecipeDietaryPredictionInput;
        case "equipment":
          return {
            type: "MODIFY_RECIPE_EQUIPMENT",
            recipe:
              ModifyRecipeEquipmentPredictionInputSchema.shape.recipe.parse(
                recipe
              ),
            prompt,
          } satisfies ModifyRecipeEquipmentPredictionInput;
        case "scale":
          return {
            type: "MODIFY_RECIPE_SCALE",
            recipe:
              ModifyRecipeScalePredictionInputSchema.shape.recipe.parse(recipe),
            prompt,
          } satisfies ModifyRecipeScalePredictionInput;
        default:
          throw new Error("undefined modification type: " + modification);
      }
    };

    const input = getInput();

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
          // kv.hset(`recipe:${slug}`, {
          //   runStatus: "error",
          //   error,
          //   outputRaw,
          // }).then(noop);
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

  const store = map<StoreProps>({
    loading: true,
    recipe: {
      name: recipe.name,
      description: recipe.description,
      slug: branchedSlug,
      fromResult: recipe.fromResult,
      createdAt: new Date().toISOString(),
      runStatus: "initializing",
    },
  });

  const Footer = () => {
    const saveAsNewRecipe = async () => {
      "use server";
      console.log("SAVE! new");
    };
    const saveRecipe = async () => {
      "use server";
      console.log("SAVE!");
    };

    return (
      <WaitForStore
        store={store}
        selector={(state) => (state.recipe.yield ? true : undefined)}
      >
        <FloatingDock>
          <div className="flex flex-col gap-2 p-3">
            <Card className="flex flex-col gap-2">
              <CardHeader className="flex flex-row gap-3 items-center">
                <div className="flex items-center aspect-square px-4 border border-muted-foreground rounded-md">
                  <ArrowRightLeftIcon />
                </div>
                <div className="flex flex-col gap-1">
                  <h3 className="text-lg font-medium">Substituting...</h3>
                  <p className="text-sm text-muted-foreground">
                    &quot;{prompt}&quot;
                  </p>
                </div>
              </CardHeader>
            </Card>
            <div className="flex flex-col gap-2 justify-end">
              <form action={saveRecipe}>
                <Button type="submit" className="block w-full">
                  <span>Save over </span>
                  <span className="font-semibold">Existing</span>
                </Button>
              </form>
              <form action={saveAsNewRecipe}>
                <Button type="submit" className="block w-full">
                  <span>Save as </span>
                  <span className="font-semibold">New Recipe</span>
                </Button>
              </form>
            </div>
          </div>
        </FloatingDock>
      </WaitForStore>
    );
  };
  // console.log(recipe.);

  return (
    <div className="flex flex-col gap-2 max-w-2xl mx-auto px-4 my-3">
      {/* <Header /> */}
      <Card className="flex flex-col gap-2 pb-5 mx-3">
        <Suspense fallback={null}>
          <Generator />
        </Suspense>
        <RecipeContents store={store} {...recipe} />
      </Card>
      <Suspense fallback={null}>
        <Footer />
      </Suspense>
    </div>
  );
}
