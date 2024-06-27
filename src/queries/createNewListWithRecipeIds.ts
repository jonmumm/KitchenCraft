import { ListRecipeTable, ListTable } from "@/db";
import { assert, slugToSentence } from "@/lib/utils";
import { DbOrTransaction } from "@/types";

export const createNewListWithRecipeIds = async (input: {
  db: DbOrTransaction;
  userId: string;
  recipeIdsToAdd: string[];
  listSlug: string;
  icon?: string;
}) => {
  const result = await input.db
    .insert(ListTable)
    .values({
      name: slugToSentence(input.listSlug),
      slug: input.listSlug,
      icon: input.icon || "#️⃣",
      createdBy: input.userId,
    })
    .returning({
      id: ListTable.id,
      name: ListTable.name,
      slug: ListTable.slug,
      icon: ListTable.icon,
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
