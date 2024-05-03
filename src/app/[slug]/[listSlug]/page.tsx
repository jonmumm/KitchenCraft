import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/display/card";
import {
  ListRecipeTable,
  ListTable,
  ProfileTable,
  RecipesTable,
  db,
} from "@/db";
import { assert } from "@/lib/utils";
import { ProfileSlugSchema } from "@/schema";
import { and, eq } from "drizzle-orm";
import Link from "next/link";
import { redirect } from "next/navigation";

const NUM_PLACEHOLDER_RECIPES = 30;

export const dynamic = "force-dynamic";

export default async function Page(props: {
  params: { slug: string; listSlug: string };
}) {
  const slug = decodeURIComponent(props.params.slug);

  const profileParse = ProfileSlugSchema.safeParse(slug);
  if (!profileParse.success) {
    redirect("/");
  }
  const profileSlug = profileParse.data.slice(1);

  // Fetch the profile based on the provided slug
  const profile = await db
    .select()
    .from(ProfileTable)
    .where(eq(ProfileTable.profileSlug, profileSlug))
    .execute();

  if (profile.length === 0) {
    // Handle case where profile does not exist
    redirect("/");
  }
  const listUserId = profile[0]?.userId;
  assert(listUserId, "expected listUserId");

  // Fetch the list based on the provided list slug and user ID from profile
  const list = (
    await db
      .select()
      .from(ListTable)
      .where(
        and(
          eq(ListTable.slug, props.params.listSlug),
          eq(ListTable.createdBy, listUserId)
        )
      )
      .execute()
  )[0];

  if (!list) {
    // Handle case where list does not exist
    redirect("/");
  }

  // Now, fetch the recipes in the list
  const recipes = await db
    .select({
      recipeId: ListRecipeTable.recipeId,
      name: RecipesTable.name,
      description: RecipesTable.description,
      tags: RecipesTable.tags,
    })
    .from(ListRecipeTable)
    .innerJoin(RecipesTable, eq(ListRecipeTable.recipeId, RecipesTable.id))
    .where(eq(ListRecipeTable.listId, list.id))
    .execute();

  return (
    <div className="flex flex-col max-w-3xl mx-auto gap-3 px-4">
      <h1 className="text-center text-xl font-bold">{list.name}</h1>
      <p className="text-muted-foreground text-xs text-center">
        by{" "}
        <Link href={`/@${profileSlug}`} className="font-semibold">
          @{profileSlug}
        </Link>
      </p>
      {recipes.map((recipe) => (
        <Card className="w-full" key={recipe.recipeId}>
          <CardHeader>
            <CardTitle>{recipe.name}</CardTitle>
            <CardDescription>{recipe.description}</CardDescription>
          </CardHeader>
        </Card>
      ))}
    </div>
  );
}
