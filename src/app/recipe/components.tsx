import { Badge } from "@/components/display/badge";
import { Card } from "@/components/display/card";
import { Skeleton } from "@/components/display/skeleton";
import { Button } from "@/components/input/button";
import { formatDuration, sentenceToSlug } from "@/lib/utils";
import { ChevronRightIcon, TimerIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import {
  getHotRecipes,
  getRecentRecipesByUser,
  getSortedMediaForRecipe,
} from "../../db/queries";
import { upvote } from "../recipe/actions";
import { UpvoteButton } from "./components.client";
import { RecipePropsProvider } from "./context";

type Recipes =
  | Awaited<ReturnType<typeof getHotRecipes>>[0]
  | Awaited<ReturnType<typeof getRecentRecipesByUser>>[0];

interface RecipeListItemProps {
  recipe: Recipes; // Define RecipeType according to your data structure
  index: number;
  userId?: string;
}

export const RecipeListItem = ({
  recipe,
  userId,
  index,
}: RecipeListItemProps) => {
  const href = `/recipe/${recipe.slug}`;
  const requireLogin = async () => {
    "use server";

    redirect("/auth/signin");
  };
  // const recipe$ = getObservableAtIndex(index, query$);

  return (
    <RecipePropsProvider
      slug={recipe.slug}
      upvote={
        userId
          ? upvote.bind(null, userId).bind(null, recipe.slug)
          : requireLogin
      }
    >
      <Card
        key={index}
        className="flex flex-col gap-3 max-w-2xl w-full mx-auto py-4 rounded-2xl border-none sm:border-solid"
      >
        <div className="px-5 flex flex-row justify-between items-center gap-4 w-full mx-auto">
          <div className="flex flex-row gap-3 justify-between items-center w-full">
            <Link href={href}>
              <Button variant="ghost" size="icon">
                {index + 1}.
              </Button>
            </Link>
            <Link href={href} className="flex-1">
              <h2 className="font-semibold text-lg">{recipe.name}</h2>
            </Link>
            <UpvoteButton count={recipe.points} />
          </div>
        </div>
        {recipe.mediaCount > 0 ? (
          <div className="h-72 relative">
            <div className="absolute w-screen left-1/2 transform -translate-x-1/2 h-72 flex justify-center z-50">
              <RecipeCarousel slug={recipe.slug} />
            </div>
            {/* <div className="absolute left-[-15px] right-[-15px] bg-slate-900 h-full z-40 rounded-box" /> */}
          </div>
        ) : null}
        <Link href={href}>
          <div className="px-5 flex flex-row gap-4 items-center">
            <p className="flex-1">{recipe.description}</p>
            <Button size="icon" variant="outline">
              <ChevronRightIcon />
            </Button>
          </div>
        </Link>
        <div className="flex-1 flex flex-row gap-1 flex-wrap px-4 justify-between">
          <div className="flex flex-row gap-1">
            {"tags" in recipe &&
              recipe.tags.map((tag) => (
                <Link
                  href={`/tag/${sentenceToSlug(tag)}`}
                  key={tag}
                  passHref={true}
                >
                  <Badge key={tag} variant="secondary">
                    {tag}
                  </Badge>
                </Link>
              ))}
          </div>
          <Badge
            className="text-xs text-muted-foreground flex flex-row gap-1"
            variant="outline"
          >
            <TimerIcon size={14} />
            <span>{formatDuration(recipe.totalTime)}</span>
          </Badge>
        </div>
      </Card>
    </RecipePropsProvider>
  );
};

const RecipeCarousel = async ({ slug }: { slug: string }) => {
  const items = new Array(10).fill(0);

  const Loader = async () => {
    return (
      <>
        {items.map((_, index) => {
          const width = Math.random() < 0.5 ? 44 : 64;
          return (
            <div className="carousel-item h-64" key={index}>
              <Skeleton className={`w-${width} h-64`} />
            </div>
          );
        })}
      </>
    );
  };

  const Content = async () => {
    const mediaList = await getSortedMediaForRecipe(slug);

    return mediaList.length ? (
      <div className="h-72 carousel carousel-center overflow-y-hidden space-x-2 flex-1 p-4 sm:p-0 md:justify-center">
        {mediaList.map((media, index) => {
          return (
            <div className="carousel-item h-64" key={index}>
              <Image
                className="rounded-box h-64 w-auto"
                src={media.url}
                priority={index === 0}
                width={media.width}
                height={media.height}
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                alt="Main media"
                placeholder="blur"
                blurDataURL={media.blobDataURL}
                // placeholder="empty"
                // style={{ objectFit: "cover" }}
              />
            </div>
          );
        })}
      </div>
    ) : null;
  };

  return (
    <Suspense fallback={<Loader />}>
      <Content />
    </Suspense>
  );
};
