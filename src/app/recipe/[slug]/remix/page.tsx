import { getRecipe } from "@/app/(home)/queries";
import { Card } from "@/components/display/card";
import { Separator } from "@/components/display/separator";
import { Skeleton } from "@/components/display/skeleton";
import { Button } from "@/components/input/button";
import StickyHeader from "@/components/layout/sticky-header";
import { LastValue } from "@/components/util/last-value";
import { RenderFirstValue } from "@/components/util/render-first-value";
import { NewRecipe, Recipe } from "@/db/types";
import { getSession } from "@/lib/auth/session";
import { getSlug } from "@/lib/slug";
import { assert } from "@/lib/utils";
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
import { BehaviorSubject, Subject } from "rxjs";
import { z } from "zod";
import {
  CraftingDetails,
  Ingredients,
  Instructions,
  Tags,
  Times,
} from "../components";
import { getObservables } from "../observables";
import { RemixGenerator } from "./components";

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
  const session = await getSession();
  const userId = session?.user.id;
  assert(userId, "expected userId");
  const baseSlug = props.params.slug;

  let prompt: string;
  let modification: string;
  try {
    prompt = z.string().min(1).parse(props.searchParams["prompt"]);
    modification = ModificationSchema.parse(props.searchParams["modification"]);
  } catch (ex) {
    return redirect(`/recipe/${baseSlug}`);
  }

  const recipe = await getRecipe(baseSlug);
  if (!recipe) {
    throw new Error(`Recipe ${baseSlug} not found`);
  }

  const remix$ = new BehaviorSubject<Partial<Recipe>>({});
  const newRecipe$ = new Subject<NewRecipe>();

  // const name$ = from();

  const {
    name$,
    description$,
    ingredients$,
    instructions$,
    tags$,
    yield$,
    activeTime$,
    cookTime$,
    totalTime$,
  } = getObservables(remix$);

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
      <RemixGenerator
        input={input}
        onProgress={(output) => {
          if (output.recipe) {
            remix$.next(output.recipe);
          }
        }}
        onError={(error, outputRaw) => {
          console.log("error", error, outputRaw);
        }}
        onComplete={(output) => {
          remix$.next(output.recipe);
          remix$.complete();

          const id = nanoid();
          const newSlug = getSlug({ id, name: output.recipe.name });

          newRecipe$.next({
            slug: newSlug,
            name: output.recipe.name,
            description: output.recipe.description,
            yield: output.recipe.yield,
            tags: output.recipe.tags,
            ingredients: output.recipe.ingredients,
            instructions: output.recipe.instructions,
            cookTime: output.recipe.cookTime,
            activeTime: output.recipe.activeTime,
            totalTime: output.recipe.totalTime,
            createdBy: userId,
            createdAt: new Date(),
          });
          newRecipe$.complete();
        }}
      />
    );
  };

  const SaveButtons = ({ newRecipe }: { newRecipe: NewRecipe }) => {
    const saveAsNewRecipe = async () => {
      "use server";
      // todo
      console.log("SAVE! new");
      console.log(newRecipe);

      redirect("/");
    };
    const saveRecipe = async () => {
      "use server";

      console.log(newRecipe);
      // const newRecipe = await firstValueFrom(remix$);

      // todo
      console.log("SAVE!");

      // await db.transaction(async (tx) => {
      //   // Define the new recipe
      //   const newRecipe = {
      //     slug: 'new-recipe-slug',
      //     name: 'New Recipe',
      //     description: 'Description of new recipe',
      //     // ... other required fields
      //   };

      //   // Insert the new recipe
      //   await tx.insert(RecipesTable).values(newRecipe);

      //   // Define the modification record
      //   const newModification = {
      //     recipeSlug: newRecipe.slug,
      //     modifiedBy: 'user-id-of-modifier',
      //     modificationType: 'creation',
      //     modificationDetails: { /* detailed JSON data about the creation */ },
      //   };

      //   // Insert the modification record
      //   await tx.insert(RecipeModificationTable).values(newModification);
      // });

      // redirect("/");
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
            <RenderFirstValue
              observable={newRecipe$}
              render={(newRecipe) => {
                return <SaveButtons newRecipe={newRecipe} />;
              }}
            />
          </Suspense>
        </div>
      </StickyHeader>

      <Card className="flex flex-col gap-2 pb-5 mx-3">
        <Suspense fallback={null}>
          <Generator />
        </Suspense>
        <div className="flex flex-row gap-3 p-5 justify-between">
          <div className="flex flex-col gap-2 flex-1">
            <Suspense fallback={<Skeleton className="w-full h-14" />}>
              <h1 className="text-2xl font-semibold">
                <LastValue observable={name$} />
              </h1>
            </Suspense>
            <Suspense fallback={<Skeleton className="w-full h-24" />}>
              <p className="text-lg text-muted-foreground">
                <LastValue observable={description$} />
              </p>
            </Suspense>
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
    </div>
  );
}
