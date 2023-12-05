import { UpvotesTable, db } from "./db";

export async function upvote(userId: string, slug: string) {
  "use server";

  console.log("upvote", slug, userId);
  await db
    .insert(UpvotesTable)
    .values({
      slug,
      userId,
    })
    .returning()
    .then((res) => res[0]);
}
