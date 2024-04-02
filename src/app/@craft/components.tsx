import { Badge } from "@/components/display/badge";
import { Label } from "@/components/display/label";
import { Button } from "@/components/input/button";
import KeyboardAvoidingView from "@/components/layout/keyboard-avoiding-view";
import ClientOnly from "@/components/util/client-only";
import { db } from "@/db";
import { getMostUsedTagsLastWeek } from "@/db/queries";
import {
  CarrotIcon,
  ChevronRightIcon,
  Loader2Icon,
  TagIcon,
  XIcon,
} from "lucide-react";
import { FC, ReactNode } from "react";
import { twc } from "react-twc";
import {
  ClearButton,
  CraftEmpty,
  CraftNotEmpty,
  CraftNotReadyToSave,
  CraftNotSaving,
  CraftReadyToSave,
  CraftSaving,
  PrevButton,
  SuggestedRecipeCards,
  // SuggestedTagBadge,
  SuggestedTokenBadge,
  UndoButton,
} from "./components.client";

const Container = twc.div`flex flex-col gap-2 h-full max-w-3xl mx-auto w-full`;
const Section = twc.div`flex flex-col gap-1`;

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

const IngredientsLabel = () => {
  return <SectionLabel icon={CarrotIcon} title={"Ingredients"} />;
};

const TrendingIngredientsSection = () => {
  return (
    <CraftEmpty>
      <Section>
        <IngredientsLabel />
        <BadgeList>
          {TRENDING_INGREDIENTS.map((ingredient) => {
            return (
              <Badge
                variant="secondary"
                className="carousel-item flex flex-row gap-1"
                key={ingredient}
                event={{ type: "ADD_TOKEN", token: ingredient }}
              >
                {ingredient}
              </Badge>
            );
          })}
        </BadgeList>
      </Section>
    </CraftEmpty>
  );
};

const QuickAddSection = () => {
  const items = new Array(6).fill(0);
  return (
    <CraftNotEmpty>
      <Section>
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
      <Section>
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

interface SectionLabelProps {
  icon: React.ElementType; // This type is used for components passed as props
  title: string;
}

const SectionLabel: FC<SectionLabelProps> = ({ icon: Icon, title }) => {
  return (
    <Label className="text-xs text-muted-foreground uppercase font-semibold px-4 flex flex-row gap-1">
      <Icon size={14} />
      {title}
    </Label>
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
        <TrendingIngredientsSection />
        <TrendingTagsSection />
      </Container>
      <Footer>
        <ClientOnly>
          <CraftNotEmpty>
            <CraftSaving>
              <div className="flex gap-2 justify-center items-center px-2 mb-6 max-w-3xl w-full mx-auto">
                <Badge variant="secondary" className="shadow-xl">
                  Crafting <span className="text-xs animate-spin ml-2">🧪</span>
                </Badge>
              </div>
            </CraftSaving>
            <CraftNotSaving>
              <div className="max-w-3xl w-full standalone:mb-10 mx-auto">
                <div className="flex flex-row gap-2 items-center w-full bg-slate-50 dark:bg-slate-950 p-2 border-t-2 border-solid border-slate-200 dark:border-slate-800">
                  {/* <CloseButton /> */}
                  {/* <ClearButton /> */}
                  {/* <UndoButton /> */}
                  <PrevButton />
                  <SaveButton />
                  <NextButton />
                </div>
              </div>
            </CraftNotSaving>
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
  console.log("srs");
  return (
    <CraftNotEmpty>
      <div className="flex flex-col items-center justify-center px-4 mt-4 mb-2">
        <div className="relative w-full max-w-3xl">
          <SuggestedRecipeCards />
          {/* <Card className="w-full z-40 absolute inset-0 -mt-4 scale-95">
            <CardHeader>
              <CardTitle>Chocolate Chip Cookies</CardTitle>
              <CardDescription>
                Gooey baked in tghe oven for 35 minutes. A classic recipe.
              </CardDescription>
            </CardHeader>
            <Separator className="mb-6" />
            <CardContent className="flex justify-end">
              <Button variant="secondary">
                Continue Crafting <ChevronsRightIcon />
              </Button>
            </CardContent>
          </Card>
          <Card className="w-full z-30 absolute inset-0 -mt-8 scale-90">
            <CardHeader>
              <CardTitle>Chocolate Chip Cookies</CardTitle>
              <CardDescription>
                Gooey baked in tghe oven for 35 minutes. A classic recipe.
              </CardDescription>
            </CardHeader>
            <Separator className="mb-6" />
            <CardContent className="flex justify-end">
              <Button variant="secondary">
                Continue Crafting <ChevronsRightIcon />
              </Button>
            </CardContent>
          </Card> */}
        </div>
      </div>
    </CraftNotEmpty>
  );
};

const SaveButton = () => {
  return (
    <div className="flex flex-row justify-center pointer-events-none w-full">
      <CraftNotReadyToSave>
        <Button size="lg" className="w-full pointer-events-auto" disabled>
          <Loader2Icon size={14} className="animate-spin ml-2" />
        </Button>
      </CraftNotReadyToSave>
      <CraftReadyToSave>
        <Button
          size="lg"
          className="w-full pointer-events-auto shadow-xl"
          event={{ type: "SAVE" }}
        >
          Save
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
        className="pointer-events-auto px-3 py-2 cursor-pointer"
        variant="outline"
      >
        Next
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
