import { Badge } from "@/components/display/badge";
import { Label } from "@/components/display/label";
import { Button } from "@/components/input/button";
import KeyboardAvoidingView from "@/components/layout/keyboard-avoiding-view";
import ClientOnly from "@/components/util/client-only";
import { db } from "@/db";
import { getMostUsedTagsLastWeek } from "@/db/queries";
import {
  Loader2Icon,
  MoveRightIcon,
  PlusCircleIcon,
  ShareIcon,
  TagIcon,
} from "lucide-react";
import { ReactNode } from "react";
import {
  AddedRecipesCarousel,
  Container,
  CraftEmpty,
  CraftNotEmpty,
  CraftNotReadyToSave,
  CraftReadyToSave,
  LoadMoreCard,
  SaveRecipeBadge,
  Section,
  SectionLabel,
  SuggestedIngredientsSection,
  SuggestedRecipeCards,
  SuggestedTagsSection,
  // SuggestedTagBadge,
  SuggestedTokenBadge,
} from "./components.client";

const TRENDING_INGREDIENTS = [
  "Quinoa",
  "Avocado",
  "Kale",
  "Sweet Potato",
  "Chickpeas",
  "Almond Milk",
  "Coconut Oil",
  "Chia Seeds",
  "Turmeric",
  "Lentils",
  "Matcha",
  "Cauliflower",
  "Tempeh",
  "Spirulina",
  "Jackfruit",
  "Seitan",
  // "Kimchi",
  // "Tahini",
  // "Miso",
  // "Goji Berries",
  // "Hemp Hearts",
  // "Nutritional Yeast",
  // "Acai",
  // "Edamame",
  // "Soba Noodles",
  // "Gochujang",
  // "Tofu",
  // "Pumpkin Seeds",
  // "Arugula",
  // "Mango",
  // "Artichoke",
];

const BadgeList = ({ children }: { children: ReactNode }) => {
  return <div className="px-4 flex flex-row gap-2 flex-wrap">{children}</div>;
};

const QuickAddSection = () => {
  const items = new Array(6).fill(0);
  return (
    <CraftNotEmpty>
      <Section className="max-w-3xl mx-auto">
        {/* <SectionLabel icon={PlusIcon} title={"Add"} /> */}
        <BadgeList>
          {items.map((_, index) => {
            return (
              <SuggestedTokenBadge
                key={index}
                index={index}
                className="carousel-item flex flex-row"
              />
            );
          })}
        </BadgeList>
      </Section>
    </CraftNotEmpty>
  );
};

const TRENDING_TAGS = [
  {
    tag: "Korean",
    type: "Inspiration",
  },
  {
    tag: "Vegan",
    type: "Audience",
  },
  {
    tag: "Family Size",
    type: "Servings",
  },
  {
    tag: "Main Course",
    type: "Dish",
  },
  {
    tag: "Today",
    type: "Time",
  },
  {
    tag: "High Protein Diets",
    type: "Nutrition",
  },
  {
    tag: "No Gluten",
    type: "Ingredients to Exclude",
  },
  {
    tag: "Air Fryer",
    type: "Equipment",
  },
  {
    tag: "Cauliflower Rice",
    type: "Substitutions",
  },
  {
    tag: "Quick Cook",
    type: "Cooking Time",
  },
  {
    tag: "Thai",
    type: "Inspiration",
  },
  {
    tag: "Health-Conscious",
    type: "Audience",
  },
  {
    tag: "Individual Portions",
    type: "Servings",
  },
  {
    tag: "Appetizer",
    type: "Dish",
  },
  {
    tag: "Quick Prep",
    type: "Time",
  },
  {
    tag: "Keto",
    type: "Nutrition",
  },
  {
    tag: "No Dairy",
    type: "Exclusion",
  },
  {
    tag: "Slow Cooker",
    type: "Equipment",
  },
  {
    tag: "Tofu",
    type: "Substitutions",
  },
  {
    tag: "Overnight",
    type: "Cooking Time",
  },
] as const;

const TrendingTagsSection = () => {
  return (
    <CraftEmpty>
      <Section className="max-w-3xl mx-auto">
        {/* <InstantRecipeItem /> */}
        <TagsLabel />
        <BadgeList>
          {TRENDING_TAGS.map(({ tag, type }) => {
            return (
              <Badge
                variant="secondary"
                className="carousel-item flex flex-row gap-1 items-center"
                key={tag}
                event={{ type: "ADD_TOKEN", token: tag }}
              >
                {tag}
              </Badge>
            );
          })}
        </BadgeList>
      </Section>
    </CraftEmpty>
  );
};

const TagsLabel = () => {
  return <SectionLabel icon={TagIcon} title="Tags" />;
};

export const NewRecipeResultsView = () => {
  return (
    <>
      <Container className="gap-4 flex-1">
        <QuickAddSection />
        <SuggestedRecipesSection />
        <SuggestedIngredientsSection />
        <SuggestedTagsSection />
        {/* <TrendingTagsSection /> */}
      </Container>
      <Footer>
        <ClientOnly>
          <CraftNotEmpty>
            <div className="max-w-3xl w-full standalone:mb-10 mx-auto overflow-hidden">
              <div className="flex flex-row gap-2 items-center w-full p-2 justify-between">
                {/* <CloseButton /> */}
                {/* <ClearButton /> */}
                {/* <UndoButton /> */}
                {/* <PrevButton /> */}
                {/* <SaveRecipeBadge /> */}
                <AddedRecipesCarousel />
                {/* <CraftSaving>
                  <Badge variant="secondary" className="shadow-xl">
                    Saving <span>My Recipe clanem</span>
                    <span className="text-xs animate-spin ml-2">🧪</span>
                  </Badge>
                </CraftSaving> */}
                {/* <GoToButton /> */}
                {/* <ShareButton /> */}
                {/* <LikeButton /> */}
                {/* <NextButton /> */}
              </div>
            </div>
          </CraftNotEmpty>
          {/* <CraftEmpty>
            <div className="max-w-3xl w-full standalone:mb-10 mx-auto">
              <div className="flex flex-row gap-2 items-center w-full bg-slate-50 dark:bg-slate-950 p-2 border-t-2 border-solid border-slate-200 dark:border-slate-800 justify-center">
                <CloseButton />
                <ClearButton />
                <UndoButton />
              </div>
            </div>
          </CraftEmpty> */}
        </ClientOnly>
      </Footer>
    </>
  );
};

export const Ideas = () => {
  const arr = new Array(20).fill(0);

  try {
    getMostUsedTagsLastWeek(db).then(console.log);
  } catch (ex) {
    console.error(ex);
  }
  //   const tags$ = from(getMostUsedTagsLastWeek(db)).pipe(shareReplay(1));

  return (
    <div className="flex flex-col gap-2">
      <Label className="text-xs text-muted-foreground uppercase font-semibold mt-4">
        Trending
      </Label>
      <div className="flex flex-row gap-2 flex-wrap">
        {arr.map((_, index) => {
          return null;
        })}
      </div>
    </div>
  );
};

export const Selections = () => {
  const arr = new Array(30).fill(0);

  return <></>;
};

const SuggestedRecipesSection = () => {
  // const items = new Array(6).fill(0);

  return (
    <CraftNotEmpty>
      <div className="flex flex-col gap-3 items-center px-4">
        <SuggestedRecipeCards />
        <LoadMoreCard />
        {/* {items.map((item, index) => {
          return (
            <Card key={index} className="carousel-item w-4/5">
              Hello
            </Card>
          );
        })} */}
      </div>
    </CraftNotEmpty>
  );

  // return (
  //   <CraftNotEmpty>
  //     <div className="flex flex-col items-center justify-center px-4 mt-4 mb-2">
  //       <div className="relative w-full max-w-3xl carousel">
  //         <SuggestedRecipeCards />
  //         {/* <Card className="w-full z-40 absolute inset-0 -mt-4 scale-95">
  //           <CardHeader>
  //             <CardTitle>Chocolate Chip Cookies</CardTitle>
  //             <CardDescription>
  //               Gooey baked in tghe oven for 35 minutes. A classic recipe.
  //             </CardDescription>
  //           </CardHeader>
  //           <Separator className="mb-6" />
  //           <CardContent className="flex justify-end">
  //             <Button variant="secondary">
  //               Continue Crafting <ChevronsRightIcon />
  //             </Button>
  //           </CardContent>
  //         </Card>
  //         <Card className="w-full z-30 absolute inset-0 -mt-8 scale-90">
  //           <CardHeader>
  //             <CardTitle>Chocolate Chip Cookies</CardTitle>
  //             <CardDescription>
  //               Gooey baked in tghe oven for 35 minutes. A classic recipe.
  //             </CardDescription>
  //           </CardHeader>
  //           <Separator className="mb-6" />
  //           <CardContent className="flex justify-end">
  //             <Button variant="secondary">
  //               Continue Crafting <ChevronsRightIcon />
  //             </Button>
  //           </CardContent>
  //         </Card> */}
  //       </div>
  //     </div>
  //   </CraftNotEmpty>
  // );
};

const ShareButton = () => {
  return (
    <div className="flex flex-row justify-center pointer-events-none w-full">
      <CraftNotReadyToSave>
        <Button
          size="lg"
          className="w-full pointer-events-auto"
          disabled
          variant="secondary"
        >
          <Loader2Icon size={14} className="animate-spin ml-2" />
        </Button>
      </CraftNotReadyToSave>
      <CraftReadyToSave>
        <Button
          size="lg"
          className="w-full pointer-events-auto shadow-xl"
          variant="secondary"
          event={{ type: "SHARE", slug: "foobar" }}
        >
          <span>Share</span>
          <ShareIcon className="ml-2" size={15} />
        </Button>
      </CraftReadyToSave>
    </div>
  );
};

const LikeButton = () => {
  return (
    <div className="flex flex-row justify-center pointer-events-none w-full">
      <CraftNotReadyToSave>
        <Button
          size="lg"
          className="pointer-events-auto"
          disabled
          variant="outline"
        >
          <Loader2Icon size={14} className="animate-spin ml-2" />
        </Button>
      </CraftNotReadyToSave>
      <CraftReadyToSave>
        <Button
          size="lg"
          className="pointer-events-auto shadow-xl"
          variant="outline"
          event={{ type: "SAVE" }}
        >
          Add
          <PlusCircleIcon className="ml-2" size={15} />
        </Button>
      </CraftReadyToSave>
    </div>
  );
};

const NextButton = () => {
  return (
    <div className="flex flex-row justify-center pointer-events-none">
      <Button
        event={{ type: "NEXT" }}
        size="lg"
        className="pointer-events-auto px-3 py-2 cursor-pointer shadow-xl rounded-full"
      >
        <MoveRightIcon size={32} />
      </Button>
    </div>
  );
};

// const CloseButton = () => {
//   return (
//     <div className="flex flex-row justify-center pointer-events-none">
//       <Button
//         event={{ type: "CLOSE" }}
//         size="lg"
//         className="pointer-events-auto px-3 py-2 cursor-pointer"
//         variant="outline"
//       >
//         <XIcon size={14} />
//       </Button>
//     </div>
//   );
// };

const Footer = ({ children }: { children: ReactNode }) => {
  return <KeyboardAvoidingView>{children}</KeyboardAvoidingView>;
};
