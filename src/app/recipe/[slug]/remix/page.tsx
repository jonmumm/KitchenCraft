import { getRecipe } from "@/app/(home)/queries";
import { Card } from "@/components/display/card";
import { Separator } from "@/components/display/separator";
import { Skeleton } from "@/components/display/skeleton";
import { Button } from "@/components/input/button";
import StickyHeader from "@/components/layout/sticky-header";
import { LastValue } from "@/components/util/last-value";
import { WaitForLastValue } from "@/components/util/wait-for-last-value";
import { Recipe } from "@/db/types";
import { getSlug } from "@/lib/slug";
import {
  ModificationSchema,
  ModifyRecipeDietaryPredictionInputSchema,
  ModifyRecipeEquipmentPredictionInputSchema,
  ModifyRecipeFreeTextPredictionInputSchema,
  ModifyRecipeIngredientsPredictionInputSchema,
  ModifyRecipeScalePredictionInputSchema,
} from "@/schema";
import {
  ModifyRecipeDietaryPredictionInput,
  ModifyRecipeEquipmentPredictionInput,
  ModifyRecipeFreeTextPredictionInput,
  ModifyRecipeIngredientsPredictionInput,
  ModifyRecipeScalePredictionInput,
} from "@/types";
import { nanoid } from "ai";
import {
  ArrowLeftIcon,
  LoaderIcon,
  ScrollIcon,
  ShoppingBasketIcon,
} from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { BehaviorSubject, identity } from "rxjs";
import { z } from "zod";
import {
  CraftingDetails,
  Ingredients,
  Instructions,
  Tags,
  Times,
} from "../components";
import { getObservables } from "../observables";
import RecipeGenerator from "../recipe-generator";
// import { Tags } from "../tags";
// import { Times } from "../times";
// import { Yield } from "../yield";

type Props = {
  params: { slug: string };
  searchParams: Record<string, string>;
};

/**
 *
 * @param props
 * @returns
 */
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

  // const recipeKey = `recipe:${baseSlug}`;
  // const recipe = CompletedRecipeSchema.parse(await kv.hgetall(recipeKey));
  const recipe = await getRecipe(baseSlug);
  if (!recipe) {
    throw new Error(`Recipe ${baseSlug} not found`);
  }
  const remix$ = new BehaviorSubject<Partial<Recipe>>({});

  const {
    ingredients$,
    instructions$,
    tags$,
    yield$,
    activeTime$,
    cookTime$,
    totalTime$,
  } = getObservables(remix$);

  // instructions$.pipe(identity).subscribe({
  //   next(value) {
  //     console.log(value);
  //   },
  // });

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
        case "free_text":
          return {
            type: "MODIFY_RECIPE_FREE_TEXT",
            recipe:
              ModifyRecipeFreeTextPredictionInputSchema.shape.recipe.parse(
                recipe
              ),
            prompt,
          } satisfies ModifyRecipeFreeTextPredictionInput;
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
            remix$.next(output.recipe);
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
          remix$.next(output.recipe);
          // console.log(output.recipe);
          remix$.complete();

          // store.setKey("recipe", {
          //   ...store.get().recipe,
          //   ...output.recipe,
          // });
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

          // store.setKey("loading", false);
        }}
      />
    );
  };

  const SaveButtons = () => {
    const saveAsNewRecipe = async () => {
      "use server";
      console.log("SAVE! new");
      return redirect("/");
    };
    const saveRecipe = async () => {
      "use server";
      console.log("SAVE!");
      return redirect("/");
    };

    return (
      <div className="flex flex-row gap-2">
        <form action={saveRecipe}>
          <Button type="submit" size="lg">
            Save (Over)
          </Button>
        </form>
        <form action={saveAsNewRecipe}>
          <Button type="submit" size="lg">
            Save New
          </Button>
        </form>
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-2 max-w-2xl mx-auto px-4 my-3">
      <StickyHeader>
        <div className="flex flex-row gap-2 justify-between items-center">
          <Link href={`/recipe/${recipe.slug}`}>
            <Button size="icon" variant="outline">
              <ArrowLeftIcon />
            </Button>
          </Link>
          <Suspense
            fallback={
              <div className="flex flex-row items-center justify-start gap-2 h-full">
                <span>Remixing...</span>
                <LoaderIcon className="animate-spin" />
              </div>
            }
          >
            <WaitForLastValue observable={remix$}>
              <SaveButtons />
            </WaitForLastValue>
          </Suspense>
        </div>
      </StickyHeader>

      <Card className="flex flex-col gap-2 pb-5 mx-3">
        <Suspense fallback={null}>
          <Generator />
        </Suspense>
        <div className="flex flex-row gap-3 p-5 justify-between">
          <div className="flex flex-col gap-2">
            <h1 className="text-2xl font-semibold">{recipe.name}</h1>
            <p className="text-lg text-muted-foreground">
              {recipe.description}
            </p>
            <div className="text-sm text-muted-foreground flex flex-row gap-2 items-center">
              <span>Yields</span>
              <span>
                <Suspense fallback={<Skeleton className="w-24 h-5" />}>
                  <LastValue observable={yield$} />
                </Suspense>
              </span>
            </div>
          </div>
        </div>
        <Separator />
        <div className="flex flex-row gap-2 p-2 justify-center hidden-print">
          <div className="flex flex-col gap-2 items-center">
            <Suspense fallback={<Skeleton className="w-full h-20" />}>
              <CraftingDetails createdAt={new Date().toDateString()} />
            </Suspense>
          </div>
        </div>
        <Separator className="hidden-print" />
        <Times
          totalTime$={totalTime$}
          activeTime$={activeTime$}
          cookTime$={cookTime$}
        />
        <Separator />
        <Tags tags$={tags$} />
        <Separator />

        <div className="px-5">
          <div className="flex flex-row justify-between gap-1 items-center py-4">
            <h3 className="uppercase text-xs font-bold text-accent-foreground">
              Ingredients
            </h3>
            <ShoppingBasketIcon />
          </div>
          <div className="mb-4 flex flex-col gap-2">
            <ul className="list-disc pl-5 flex flex-col gap-2">
              <Ingredients ingredients$={ingredients$} />
            </ul>
          </div>
        </div>
        <Separator />

        <div className="px-5">
          <div className="flex flex-row justify-between gap-1 items-center py-4">
            <h3 className="uppercase text-xs font-bold text-accent-foreground">
              Instructions
            </h3>
            <ScrollIcon />
          </div>
          <div className="mb-4 flex flex-col gap-2">
            <ol className="list-decimal pl-5 flex flex-col gap-2">
              <Instructions instructions$={instructions$} />
            </ol>
          </div>
        </div>
      </Card>
      {/* <Suspense fallback={null}>
        <Footer />
      </Suspense> */}
    </div>
  );
}
