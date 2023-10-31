import { Header } from "@/app/header";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Command,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { ModificationSchema, RecipeSchema } from "@/schema";
import { kv } from "@vercel/kv";
import {
  MicrowaveIcon,
  MinusSquareIcon,
  NutOffIcon,
  ReplaceIcon,
  ScaleIcon,
  ShuffleIcon,
} from "lucide-react";
import { ActionGroup } from "./action-group";
import { EquipmentGroup } from "./equipment-group";
// import { IngredientsGroup } from "./ingredients-group";
import { Skeleton } from "@/components/ui/skeleton";
import { Suspense } from "react";
import { z } from "zod";
import { DietaryGroup } from "./dietary-group";
import { RemixInput } from "./remix-input";
import { ScaleGroup } from "./scale-group";

type Props = {
  params: { slug: string };
  searchParams: Record<string, string>;
};

export default async function Page(props: Props) {
  const modification = ModificationSchema.parse(
    props.searchParams["modification"]
  );
  console.log({ modification });
  const { slug } = props.params;

  const recipeKey = `recipe:${slug}`;

  const recipe = RecipeSchema.parse(await kv.hgetall(recipeKey));

  return (
    <div className="flex flex-col gap-2 max-w-2xl mx-auto px-4">
      <Header hidden={true} />
      <Card>
        <Command shouldFilter={false}>
          <CardHeader className="items-start">
            <div className="flex flex-row gap-3 items-center">
              {modification === "substitute" && <ReplaceIcon />}
              {modification === "dietary" && <NutOffIcon />}
              {modification === "equipment" && <MicrowaveIcon />}
              {modification === "scale" && <ScaleIcon />}
              <div className="flex flex-col gap-1">
                {/* <CardDescription> */}
                <span>Remixing <span className="font-semibold">{recipe.name}</span></span>
                {modification === "substitute" && <SubstituteDescription />}
                {modification === "dietary" && <DietaryDescription />}
                {modification === "equipment" && <EquipmentDescription />}
                {modification === "scale" && <ScaleDescription />}
                {/* </CardDescription> */}
              </div>
            </div>
          </CardHeader>
          <CardContent className="round-md p-0">
            {/* <ModificationSection /> */}
            <div className="w-full">
              <form>
                <RemixInput />
                {/* <CraftInput
                  // onValueChange={changeAction}
                  defaultValue={prompt}
                /> */}
              </form>
            </div>
            <CommandList className="p-3 max-h-100">
              <ActionGroup />
              {modification === "substitute" && (
                <IngredientsGroup slug={slug} />
              )}
              {modification === "equipment" && <EquipmentGroup />}
              {modification === "dietary" && <DietaryGroup />}
              {modification === "scale" && <ScaleGroup />}
              {/* <CommandGroup heading="Ideas"> */}
              {/* <RemixIdeas slug={slug} /> */}
              {/* </CommandGroup> */}
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

const SubstituteDescription = () => (
  <p className="text-xs font-medium text-muted-foreground">
    <span className="font-semibold">Substitute:</span> Find alternative
    ingredients.
  </p>
);

const EquipmentDescription = () => (
  <p className="text-xs font-medium text-muted-foreground">
    <span className="font-semibold">Equipment:</span> Adapt recipe for different
    tools.
  </p>
);

const DietaryDescription = () => (
  <p className="text-xs font-medium text-muted-foreground">
    <span className="font-semibold">Dietary:</span> Modify recipe for specific
    diets.
  </p>
);

const ScaleDescription = () => (
  <p className="text-xs font-medium text-muted-foreground">
    <span className="font-semibold">Scale:</span> Adjust recipe for more/fewer
    servings.
  </p>
);

const IngredientsGroup = (props: { slug: string }) => {
  const IngredientItems = async () => {
    const ingredients = z
      .array(z.string())
      .parse(await kv.hget(`recipe:${props.slug}`, "ingredients"));

    return ingredients.map((item) => {
      return (
        <CommandItem key={item}>
          <span className="flex-1">{item}</span>
          <MinusSquareIcon
            color="red"
            className="opacity-50 ring-destructive"
          />
        </CommandItem>
      );
    });
  };

  return (
    <CommandGroup heading="Ingredients">
      <Suspense fallback={<Skeleton className="w-full h-12" />}>
        <IngredientItems />
      </Suspense>
    </CommandGroup>
  );
};
