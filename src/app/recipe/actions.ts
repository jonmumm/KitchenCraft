import { UpvotesTable, db } from "@/db";
import { getErrorMessage } from "@/lib/error";

export const upvote = async (userId: string, slug: string) => {
  "use server";

  try {
    const result = await db
      .insert(UpvotesTable)
      .values({
        slug: slug,
        userId: userId,
      })
      .onConflictDoNothing()
      .returning(); // Retrieve the inserted row

    if (result.length === 0) {
      return {
        success: false as const,
        error: "No upvote added due to possible duplicate or conflict.",
      };
    }

    return { success: true as const };
  } catch (error) {
    return { success: false as const, error: getErrorMessage(error) }; // Return the error message
  }
};
