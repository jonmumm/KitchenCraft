import { AsyncRenderLastValue } from "@/components/util/async-render-last-value";
import { db } from "@/db";
import {
  getProfileByUserId,
  getRecentRecipesByCreator,
  updateRecipeCreator,
} from "@/db/queries";
import { getCurrentUserId } from "@/lib/auth/session";
import { getGuestId } from "@/lib/browser-session";
import { redirect } from "next/navigation";
import { from, shareReplay } from "rxjs";
import { RecipeListItem } from "../recipe/components";

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
    const currentProfile = await getProfileByUserId(currentUserId);
    if (currentProfile?.activated) {
      redirect(`/@${currentProfile?.profileSlug}`);
    }
    createdBy = currentUserId;
  } else {
    createdBy = guestId;
  }
  console.log({ currentUserId, guestId, createdBy });

  const [recipes$] = [
    from(getRecentRecipesByCreator(createdBy)).pipe(shareReplay(1)),
  ];
  // const browserSessionId = await getGuestId();

  return (
    <div className="flex flex-col max-w-2xl mx-auto px-4">
      <section>
        <div className="flex flex-col gap-12">
          {new Array(NUM_PLACEHOLDER_RECIPES).fill(0).map((_, index) => (
            <AsyncRenderLastValue
              key={index}
              fallback={null}
              observable={
                recipes$
                // recipesByIndex$[index]?.pipe(defaultIfEmpty(undefined))!
              }
              render={(recipes) => {
                const recipe = recipes[index];
                return recipe ? (
                  <RecipeListItem recipe={recipe} index={index} />
                ) : (
                  <></>
                );
              }}
            />
          ))}
        </div>
      </section>
    </div>
  );
}

const NUM_PLACEHOLDER_RECIPES = 30;
