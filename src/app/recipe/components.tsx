import { Badge } from "@/components/display/badge";
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
      <div key={index} className="flex flex-col gap-3">
        <Link href={href}>
          <div className="w-full h-72 flex flex-row gap-4 relative">
            <div className="absolute bottom-3 z-50 left-0 right-0 flex justify-center">
              <div className="w-full max-w-2xl flex flex-row justify-between px-4">
                <Button variant="outline" size="icon">
                  {index + 1}.
                </Button>

                <UpvoteButton count={1} />
              </div>
            </div>

            <RecipeCarousel slug={recipe.slug} />
          </div>
        </Link>
        <div className="px-5 flex flex-row justify-between items-center gap-4 w-full max-w-2xl mx-auto">
          <Link href={href}>
            <h2 className="font-semibold text-lg flex-1">{recipe.name}</h2>
          </Link>
          <Link href="/@inspectorT" className="flex-shrink-0">
            <Badge variant="secondary" className="flex flex-row gap-1">
              <span>@inspectorT</span>
              <span className="text-muted-foreground">(+1048 🧪)</span>
            </Badge>
          </Link>
        </div>
        <Link href={href} className="w-full max-w-2xl mx-auto">
          <div className="px-5 flex flex-row gap-4 items-center">
            <p className="flex-1">{recipe.description}</p>
            <Button size="icon" variant="outline">
              <ChevronRightIcon />
            </Button>
          </div>
        </Link>
        <div className="w-full px-5 flex flex-row justify-between items-center max-w-2xl mx-auto">
          <Badge
            className="text-xs text-muted-foreground flex flex-row gap-1"
            variant="outline"
          >
            <TimerIcon size={14} />
            <span>{formatDuration(recipe.totalTime)}</span>
          </Badge>
          <div className="flex-1 flex flex-row gap-1 flex-wrap justify-end">
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
        </div>
      </div>
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

    return (
      <>
        {items.map((_, index) => {
          const media = mediaList[index];
          if (!media) {
            const width = Math.random() < 0.5 ? 44 : 64;
            return (
              <div className="carousel-item" key={index}>
                <Skeleton animation="none" className={`w-${width} h-64`} />
              </div>
            );
          }

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
                // placeholder="empty"
                // style={{ objectFit: "cover" }}
              />
            </div>
          );
        })}
      </>
    );
  };

  return (
    <div className="carousel carousel-center overflow-y-hidden space-x-2 flex-1 p-4 bg-slate-900">
      <Suspense fallback={<Loader />}>
        <Content />
      </Suspense>
    </div>
  );
};
