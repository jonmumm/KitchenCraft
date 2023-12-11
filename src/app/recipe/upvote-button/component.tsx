import { AsyncRenderFirstValue } from "@/components/util/async-render-first-value";
import { db } from "@/db";
import { getRecipePoints, hasUserVotedOnRecipe } from "@/db/queries";
import { combineLatest, from } from "rxjs";
import { UpvoteButtonClient } from "./components.client";
import { UpvoteButtonLoading } from "./loading";

export const UpvoteButton = ({
  userId,
  slug,
}: {
  userId?: string;
  slug: string;
}) => {
  return (
    userId && (
      <AsyncRenderFirstValue
        render={([hasVoted, points]) => (
          <UpvoteButtonClient count={points} alreadyVoted={hasVoted} />
        )}
        fallback={<UpvoteButtonLoading />}
        observable={combineLatest([
          from(
            userId
              ? hasUserVotedOnRecipe(db, userId, slug)
              : Promise.resolve(false)
          ),
          from(getRecipePoints(db, slug)),
        ])}
      />
    )
  );
};
