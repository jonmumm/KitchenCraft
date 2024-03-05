import { Badge } from "@/components/display/badge";
import { Separator } from "@/components/display/separator";
import { Button } from "@/components/input/button";
import {
  ResponsiveDialogContent,
  ResponsiveDialogOverlay,
  ResponsiveDialogTrigger,
} from "@/components/layout/responsive-dialog";
import { db } from "@/db";
import { getCurrentUserId } from "@/lib/auth/session";
import { getIsMobile } from "@/lib/headers";
import { redirect } from "next/navigation";
import {
  CurrentRatingValue,
  Rating,
  RatingDialog,
  RatingProvider,
  RatingStarIcon,
} from "./components.client";
import { RatingValue } from "./types";
import { upsertRecipeRating } from "./queries";
// import { UpvoteButtonClient } from "./components.client";
// import { UpvoteButtonLoading } from "./loading";

// export const RatingButton = async ({ slug }: { slug: string }) => {
//   const recipe = await getBaseRecipe(slug);
//   const userId = await getCurrentUserId();

//   const submitRating = async (
//     slug: string,
//     userId: string | undefined,
//     value: RatingValue
//   ) => {
//     "use server";
//     if (!userId) {
//       redirect(
//         `/auth/signin?message=${encodeURIComponent(
//           "Must be logged in ro rate a recipe"
//         )}&callbackUrl=${encodeURIComponent(`/recipe/${slug}`)}`
//       );
//     }

//     await upsertRecipeRating(db, userId, slug, value);
//   };
//   const value = userId
//     ? (await getRatingByUserIdAndSlug(userId, slug))?.value || 0
//     : 0;

//   return (
//     <RatingProvider defaultValue={value as RatingValue} key={slug}>
//       <RatingDialog isMobile={getIsMobile()}>
//         <ResponsiveDialogOverlay />
//         <ResponsiveDialogTrigger asChild>
//           <Button variant="outline" className="flex flex-row gap-1">
//             <RatingStarIcon />
//             <CurrentRatingValue />
//           </Button>
//         </ResponsiveDialogTrigger>
//         <ResponsiveDialogContent key={slug} className="text-center">
//           <div className="flex flex-col gap-2 items-center py-4">
//             <p className="font-semibold text-center">How would you rate?</p>
//             <div>
//               <Badge variant="outline">{recipe.name}</Badge>
//             </div>
//           </div>
//           <Separator />
//           <div className="p-4 flex justify-center mb-8">
//             <Rating
//               defaultValue={0}
//               submitValueChange={submitRating
//                 .bind(null, slug)
//                 .bind(null, userId)}
//             />
//           </div>
//         </ResponsiveDialogContent>
//       </RatingDialog>
//     </RatingProvider>
//   );
//   //   return (
//   //     userId && (
//   //       <AsyncRenderFirstValue
//   //         render={([hasVoted, points]) => (
//   //           <UpvoteButtonClient count={points} alreadyVoted={hasVoted} />
//   //         )}
//   //         fallback={<UpvoteButtonLoading />}
//   //         observable={combineLatest([
//   //           from(
//   //             userId
//   //               ? hasUserVotedOnRecipe(db, userId, slug)
//   //               : Promise.resolve(false)
//   //           ),
//   //           from(getRecipePoints(db, slug)),
//   //         ])}
//   //       />
//   //     )
//   //   );
// };
