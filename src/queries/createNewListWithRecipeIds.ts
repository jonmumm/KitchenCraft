import { ListRecipeTable, ListTable } from "@/db";
import { assert, sentenceToSlug } from "@/lib/utils";
import { DbOrTransaction } from "@/types";

export const createNewListWithRecipeIds = async (input: {
  db: DbOrTransaction;
  userId: string;
  recipeIdsToAdd: string[];
  listName: string;
}) => {
  const result = await input.db
    .insert(ListTable)
    .values({
      name: input.listName,
      slug: sentenceToSlug(input.listName),
      createdBy: input.userId,
    })
    .returning({
      id: ListTable.id,
      name: ListTable.name,
      slug: ListTable.slug,
      createdAt: ListTable.createdAt,
    });
  const list = result[0];
  assert(list, "recipe_in_use");

  if (input.recipeIdsToAdd.length) {
    await input.db.insert(ListRecipeTable).values(
      input.recipeIdsToAdd.map((recipeId) => ({
        userId: input.userId,
        listId: list.id,
        recipeId,
      }))
    );
  }

  const idSet = input.recipeIdsToAdd.reduce(
    (prev, curr) => {
      prev[curr] = true;
      return prev;
    },
    {} as Record<string, true>
  );

  return {
    ...list,
    idSet,
  };
};
