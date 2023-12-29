import { Badge } from "@/components/display/badge";
import { Card } from "@/components/display/card";
import { Separator } from "@/components/display/separator";
import { Skeleton } from "@/components/display/skeleton";
import { EventButton } from "@/components/event-button";
import { SignInForm } from "@/components/forms/sign-in/components.client";
import { AsyncRenderLastValue } from "@/components/util/async-render-last-value";
import quoteList from "@/data/quotes.json";
import { db } from "@/db";
import {
  getProfileByUserId,
  getRecentRecipesByCreator,
  getTagCountsForUserCreatedRecipes,
  updateRecipeCreator,
} from "@/db/queries";
import { getCurrentUserId } from "@/lib/auth/session";
import { getGuestId } from "@/lib/browser-session";
import { assert, shuffle } from "@/lib/utils";
import { ChevronRightIcon } from "lucide-react";
import { redirect } from "next/navigation";
import { from, of, shareReplay } from "rxjs";
import { RecipeListItem } from "../recipe/components";
import { AsyncRenderFirstValue } from "@/components/util/async-render-first-value";
import { ReactNode } from "react";
import { TagsCarousel } from "@/components/modules/tags-carousel";

export default async function Page() {
  const [currentUserId, guestId] = await Promise.all([
    getCurrentUserId(),
    getGuestId(),
  ]);

  if (currentUserId && guestId) {
    // todo only do this sometimes...
    await updateRecipeCreator(db, guestId, currentUserId);
  }

  let createdBy;
  if (currentUserId) {
    // const currentProfile = await getProfileByUserId(currentUserId);
    // if (currentProfile?.activated) {
    //   redirect(`/@${currentProfile?.profileSlug}`);
    // }
    createdBy = currentUserId;
  } else {
    createdBy = guestId;
  }

  const [recipes$] = [
    createdBy
      ? from(getRecentRecipesByCreator(createdBy)).pipe(shareReplay(1))
      : of([]),
  ];
  // const browserSessionId = await getGuestId();

  return (
    <div className="flex flex-col">
      <Separator />
      <TagsCarousel
        currentTag={"All"}
        root="/me"
        query={getTagCountsForUserCreatedRecipes(db, createdBy)}
      />
      <Separator className="mb-8 sm:mb-12" />

      <div className="flex flex-col max-w-2xl mx-auto px-4 gap-8">
        <section>
          <AsyncRenderFirstValue
            render={(recipes) => {
              return recipes.length && guestId && !currentUserId ? (
                <Card className="border-solid border-2 border-t-4 border-t-green-400">
                  <div className="p-4">
                    <h3 className="font-semibold">Save Your Recipes</h3>
                    <p className="text-xs text-muted-foreground">
                      These recipes will be{" "}
                      <span className="italic">deleted</span> in{" "}
                      <span className="font-medium">60 days</span> unless you
                      save them to your account.
                    </p>
                  </div>
                  <Separator />
                  <div className="p-4">
                    <SignInForm />
                  </div>
                </Card>
              ) : (
                <></>
              );
            }}
            observable={recipes$}
            fallback={
              <>
                <Card>
                  <Skeleton className="w-full h-6" />
                </Card>
              </>
            }
          />
        </section>
        <section>
          <div className="flex flex-col gap-12">
            {new Array(NUM_PLACEHOLDER_RECIPES).fill(0).map((_, index) => (
              <AsyncRenderLastValue
                key={index}
                fallback={<Skeleton className="w-full h-44" />}
                observable={recipes$}
                render={(recipes) => {
                  const recipe = recipes[index];
                  return recipe ? (
                    <RecipeListItem recipe={recipe} index={index} />
                  ) : (
                    <NullRecipePlaceholder index={index} />
                  );
                }}
              />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

const NUM_PLACEHOLDER_RECIPES = 15;

const NullRecipePlaceholder = ({ index }: { index: number }) => {
  const quotes = shuffle(quoteList);
  const quote = quotes[index]?.quote;
  assert(quote, "no quote for " + index);
  return (
    <EventButton key={index} event={{ type: "NEW_RECIPE" }} className="p-0">
      <Card
        key={index}
        className="w-full rounded-lg flex flex-col gap-3 items-center justify-center text-xs px-4 box-border py-20"
      >
        <p className="text-left max-w-[50%]">{quotes[index]?.quote}</p>
        <span>— {quotes[index]?.author}</span>
        <Badge
          variant="outline"
          className="flex flex-row gap-1 flex-shrink-0 mt-2"
        >
          <span>Craft New</span>
          <span>
            <ChevronRightIcon />
          </span>
        </Badge>
      </Card>
    </EventButton>
  );
};
