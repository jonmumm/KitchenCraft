import { RecipesTable } from "@/db";
import { withDatabaseSpan } from "@/lib/observability";
import { DbOrTransaction } from "@/types";
import { eq } from "drizzle-orm";

export const getAllVersionsOfRecipeBySlug = async (
  dbOrTransaction: DbOrTransaction,
  slug: string
) => {
  // First, fetch the id corresponding to the slug
  const subQuery = dbOrTransaction
    .select({
      id: RecipesTable.id,
    })
    .from(RecipesTable)
    .where(eq(RecipesTable.slug, slug))
    .limit(1); // Assuming slug is unique and only one record will be returned

  // Now, use this id to fetch all records with the same id
  const query = dbOrTransaction
    .select({
      id: RecipesTable.id,
      prompt: RecipesTable.prompt,
      // Select other fields if necessary
    })
    .from(RecipesTable)
    .where(eq(RecipesTable.id, subQuery)); // Use the subquery in the where condition

  return await withDatabaseSpan(
    query,
    "getAllVersionsOfRecipeBySlug"
  ).execute();
};
