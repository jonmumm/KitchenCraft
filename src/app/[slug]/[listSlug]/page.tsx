import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/display/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/display/collapsible";
import { Separator } from "@/components/display/separator";
import { Button } from "@/components/input/button";
import { ProfileTable, db } from "@/db";
import { getListBySlug, getRecipesByListSlug } from "@/db/queries";
import { assert, formatDuration } from "@/lib/utils";
import { MediaGalleryProvider } from "@/modules/media-gallery/components";
import {
  MediaGallery,
  MediaGalleryContainer,
  MediaGalleryItems,
} from "@/modules/media-gallery/components.client";
import { ProfileSlugSchema } from "@/schema";
import { eq } from "drizzle-orm";
import {
  ChevronsUpDownIcon,
  Loader2Icon,
  ScrollIcon,
  ShoppingBasketIcon,
  TimerIcon,
} from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

const NUM_PLACEHOLDER_RECIPES = 30;

export const dynamic = "force-dynamic";

export default async function Page(props: {
  params: { slug: string; listSlug: string };
}) {
  const slug = decodeURIComponent(props.params.slug);

  const profileParse = ProfileSlugSchema.safeParse(slug);
  if (!profileParse.success) {
    // Handle case where profile does not exist
    notFound();
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
    notFound();
  }
  const listUserId = profile[0]?.userId;
  assert(listUserId, "expected listUserId");

  // Fetch the list based on the provided list slug and user ID from profile
  const list = await getListBySlug({
    slug: props.params.listSlug,
    userId: listUserId,
  });
  if (!list) {
    notFound();
  }

  // Now, fetch the recipes in the list
  const recipes = await getRecipesByListSlug(
    db,
    listUserId,
    props.params.listSlug
  );

  return (
    <div className="flex flex-col max-w-3xl mx-auto gap-3 px-4 mb-6">
      <h1 className="text-center text-xl font-bold">{list.name}</h1>
      <p className="text-muted-foreground text-xs text-center">
        by{" "}
        <Link href={`/@${profileSlug}`} className="font-semibold">
          @{profileSlug}
        </Link>
      </p>
      {recipes.length ? (
        <>
          {recipes.map((recipe, index) => (
            <RecipeListItem key={recipe.id} recipe={recipe} index={index} />
            // <Card className="w-full" key={recipe.id}>
            //   <CardHeader>
            //     <CardTitle>{recipe.name}</CardTitle>
            //     <CardDescription>{recipe.description}</CardDescription>
            //   </CardHeader>
            //   <CardContent></CardContent>
            // </Card>
          ))}
        </>
      ) : (
        <Card className="w-full">
          <CardHeader>
            <CardTitle>Nothing here</CardTitle>
          </CardHeader>
          <CardContent>This list is empty</CardContent>
        </Card>
      )}
    </div>
  );
}

type Recipe = Awaited<ReturnType<typeof getRecipesByListSlug>>[0];

interface RecipeListItemProps {
  recipe: Recipe;
  index: number;
}

const RecipeListItem = ({ recipe, index }: RecipeListItemProps) => {
  const href = `/recipe/${recipe.slug}`;

  return (
    <MediaGalleryProvider slug={recipe.slug} minHeight={"45svh"}>
      <Collapsible>
        <Card className="max-w-2xl w-full mx-auto py-4">
          <CollapsibleTrigger asChild>
            <div className="flex flex-col gap-3">
              <div className="px-5 flex flex-row justify-between items-center gap-4 w-full mx-auto">
                <div className="flex flex-row gap-3 items-center w-full">
                  <Button variant="ghost" size="icon">
                    {index + 1}.
                  </Button>
                  <div className="flex flex-col gap-1 flex-1 justify-start">
                    <div className="flex-1 active:opacity-70">
                      <h2 className="font-semibold text-lg">
                        {recipe.name}
                        <Loader2Icon
                          size={16}
                          className="transitioning:inline-block hidden animate-spin ml-2"
                        />
                      </h2>
                    </div>
                  </div>
                  {/* <UpvoteButton userId={userId} slug={recipe.slug} /> */}
                </div>
              </div>
              {/* TODO add space here */}
              <MediaGalleryContainer>
                <MediaGallery>
                  <MediaGalleryItems />
                </MediaGallery>
              </MediaGalleryContainer>
              <div>
                <div className="px-5 flex flex-row gap-4 items-center">
                  <p className="flex-1">{recipe.description}</p>
                  <Button size="icon" variant="outline">
                    <ChevronsUpDownIcon />
                  </Button>
                </div>
              </div>
              <div className="flex-1 flex flex-col gap-3 px-4">
                <div className="text-sm text-muted-foreground flex flex-row gap-2 items-center">
                  <span>{recipe.yield}</span>
                </div>
                <div className="text-xs text-muted-foreground flex flex-row gap-1 flex-shrink-0">
                  <TimerIcon size={14} />
                  <span>{formatDuration(recipe.totalTime)}</span>
                </div>
                {/* <div className="flex flex-row gap-1 flex-wrap flex-1 justify-end">
                  {"tags" in recipe &&
                    recipe.tags.map((tag) => (
                      <NavigationLink
                        href={`/tag/${sentenceToSlug(tag)}`}
                        key={tag}
                        passHref={true}
                      >
                        <Badge key={tag} variant="secondary">
                          {tag}
                          <Loader2Icon
                            size={14}
                            className="transitioning:block hidden ml-2 animate-spin"
                          />
                        </Badge>
                      </NavigationLink>
                    ))}
                </div> */}
              </div>
            </div>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div>
              <Separator className="mt-4" />
              <div className="p-5">
                <div className="flex flex-row justify-between gap-1 items-center">
                  <h3 className="uppercase text-xs font-bold text-accent-foreground">
                    Ingredients
                  </h3>
                  <ShoppingBasketIcon />
                </div>
                <div className="flex flex-col gap-2">
                  <ul className="list-disc pl-5 flex flex-col gap-2">
                    {recipe.ingredients.map((item, index) => {
                      return <li key={index}>{item}</li>;
                    })}
                  </ul>
                </div>
              </div>
              <Separator />
              <div className="p-5">
                <div className="flex flex-row justify-between gap-1 items-center">
                  <h3 className="uppercase text-xs font-bold text-accent-foreground">
                    Instructions
                  </h3>
                  <ScrollIcon />
                </div>
                <div className="flex flex-col gap-2">
                  <ol className="list-decimal pl-5 flex flex-col gap-2">
                    {recipe.instructions.map((item, index) => {
                      return <li key={index}>{item}</li>;
                    })}
                  </ol>
                </div>
              </div>
            </div>
          </CollapsibleContent>
        </Card>
      </Collapsible>
    </MediaGalleryProvider>
  );
};
