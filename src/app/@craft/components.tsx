import { Badge } from "@/components/display/badge";
import { Label } from "@/components/display/label";
import KeyboardAvoidingView from "@/components/layout/keyboard-avoiding-view";
import { AppMatches } from "@/components/util/app-matches";
import ClientOnly from "@/components/util/client-only";
import { db } from "@/db";
import { getMostUsedTagsLastWeek } from "@/db/queries";
import { TagIcon } from "lucide-react";
import { ReactNode } from "react";
import {
  Container,
  CraftEmpty,
  CraftNotEmpty,
  HasRecipesSelected,
  Section,
  SectionLabel,
  SelectedRecipesBar,
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
      <Container className="gap-4 flex-1 mt-4">
        <QuickAddSection />
        <SuggestedRecipesSection />
        <SuggestedIngredientsSection />
        <SuggestedTagsSection />
        {/* <TrendingTagsSection /> */}
      </Container>
      <Footer>
        <ClientOnly>
          <HasRecipesSelected>
            <div className="max-w-3xl w-full standalone:mb-10 mx-auto overflow-hidden">
              <AppMatches not matchedState={{ MyCookbook: { Open: "True" } }}>
                <SelectedRecipesBar />
              </AppMatches>
            </div>
          </HasRecipesSelected>
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
        {/* <LoadMoreCard /> */}
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
};

const Footer = ({ children }: { children: ReactNode }) => {
  return <KeyboardAvoidingView>{children}</KeyboardAvoidingView>;
};
