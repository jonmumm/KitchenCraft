import { Label } from "@/components/display/label";
import KeyboardAvoidingView from "@/components/layout/keyboard-avoiding-view";
import { db } from "@/db";
import { getMostUsedTagsLastWeek } from "@/db/queries";
import { ReactNode } from "react";
import {
  Container,
  HasRecipesGenerated,
  HintCarousel,
  Section,
  SuggestedIngredientsSection,
  SuggestedRecipeCards,
  SuggestedTagsSection,
  // SuggestedTagBadge,
  SuggestedTokenBadge,
} from "./components.client";
import ClientOnly from "@/components/util/client-only";

const BadgeList = ({ children }: { children: ReactNode }) => {
  return <div className="px-4 flex flex-row gap-2 flex-wrap">{children}</div>;
};

const QuickAddSection = () => {
  const items = new Array(6).fill(0);
  return (
    <HasRecipesGenerated>
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
    </HasRecipesGenerated>
  );
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
          <HintSection />
          {/* <HasRecipesSelected>
            <div className="max-w-3xl w-full standalone:mb-10 mx-auto overflow-hidden">
              <AppMatches not matchedState={{ MyRecipes: { Open: "True" } }}>
                <SelectedRecipesBar />
              </AppMatches>
            </div>
          </HasRecipesSelected> */}
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

const HintSection = () => {
  return <HintCarousel />;
};

const SuggestedRecipesSection = () => {
  // const items = new Array(6).fill(0);

  return (
    <HasRecipesGenerated>
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
    </HasRecipesGenerated>
  );
};

const Footer = ({ children }: { children: ReactNode }) => {
  return <KeyboardAvoidingView>{children}</KeyboardAvoidingView>;
};
