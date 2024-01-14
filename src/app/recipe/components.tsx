import { Badge } from "@/components/display/badge";
import { Card } from "@/components/display/card";
import { Separator } from "@/components/display/separator";
import { Skeleton, SkeletonSentence } from "@/components/display/skeleton";
import { Button } from "@/components/input/button";
import NavigationLink from "@/components/navigation/navigation-link";
import { formatDuration, sentenceToSlug } from "@/lib/utils";
import {
  ArrowBigUpDashIcon,
  ArrowUpRightSquareIcon,
  AxeIcon,
  ChefHatIcon,
  ChevronRightIcon,
  Loader2Icon,
  TimerIcon,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import {
  getHotRecipes,
  getRecentRecipesByUser,
  getSortedMediaForRecipe,
} from "../../db/queries";
import { upvoteById } from "../recipe/actions";
import { RecipePropsProvider } from "./context";
import { UpvoteButton } from "./upvote-button/component";

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

  // const UpvoteButtonContainer = async () => {

  //   return <UpvoteButton count={recipe.points} alreadyVoted={false} />;
  // };

  return (
    <RecipePropsProvider
      slug={recipe.slug}
      upvote={
        userId
          ? upvoteById.bind(null, userId).bind(null, recipe.id)
          : requireLogin
      }
    >
      <Card className="flex flex-col gap-3 max-w-2xl w-full mx-auto py-4 rounded-2xl border-none shadow-none sm:border-solid sm:shadow-md sm:hover:shadow-lg">
        <div className="px-5 flex flex-row justify-between items-center gap-4 w-full mx-auto">
          <div className="flex flex-row gap-3 justify-between items-center w-full">
            <NavigationLink href={href}>
              <Button variant="ghost" size="icon">
                {index + 1}.
              </Button>
            </NavigationLink>
            <div className="flex flex-col gap-1 flex-1 justify-start">
              <NavigationLink href={href} className="flex-1 active:opacity-70">
                <h2 className="font-semibold text-lg">
                  {recipe.name}
                  <Loader2Icon
                    size={16}
                    className="transitioning:inline-block hidden animate-spin ml-2"
                  />
                </h2>
              </NavigationLink>
              <div>
                {"createdBySlug" in recipe && recipe.createdBySlug && (
                  // <Link
                  //   href={`/@${recipe.createdBySlug}`}
                  //   className="inline-block"
                  // >
                  <div className="inline-block">
                    <Badge
                      className="flex flex-row gap-1 items-center"
                      variant="outline"
                    >
                      <ChefHatIcon size={16} className="transitioning:hidden" />
                      <Loader2Icon
                        size={16}
                        className="transitioning:block hidden animate-spin"
                      />
                      {recipe.createdBySlug}
                    </Badge>
                  </div>
                  // </Link>
                )}
              </div>
            </div>
            <UpvoteButton userId={userId} slug={recipe.slug} />
          </div>
        </div>
        {recipe.mediaCount > 0 && (
          <div className="h-64 relative">
            <div className="absolute w-screen left-1/2 transform -translate-x-1/2 h-64 flex justify-center z-20">
              <RecipeCarousel slug={recipe.slug} priority={index === 0} />
            </div>
            {/* <div className="absolute left-[-15px] right-[-15px] bg-slate-900 h-full z-40 rounded-box" /> */}
          </div>
        )}
        <div className="flex flex-row justify-start pl-2">
          <Link
            shallow
            href={`?prompt=${encodeURIComponent(
              recipe.prompt.trim()
            )}&crafting=1`}
          >
            <Button
              className="rounded-xl max-w-xs text-xs flex flex-row gap-2 items-center px-3 h-auto py-1 flex-nowrap"
              variant="outline"
              event={{
                type: "NEW_RECIPE",
                prompt: recipe.prompt.trim(),
              }}
            >
              <AxeIcon
                size={16}
                className="text-slate-800 dark:text-slate-200 flex-shrink-0"
              />
              <p className="italic line-clamp-2 flex-1">
                &apos;{recipe.prompt.trim()}&apos;
              </p>
            </Button>
          </Link>
        </div>
        <NavigationLink href={href}>
          <div className="px-5 flex flex-row gap-4 items-center">
            <p className="flex-1">{recipe.description}</p>
            <Button size="icon" variant="outline">
              <ChevronRightIcon className="transitioning:hidden" />
              <Loader2Icon className="transitioning:block hidden animate-spin" />
            </Button>
          </div>
        </NavigationLink>
        <div className="flex-1 flex flex-row gap-1 px-4 justify-between items-start">
          <div className="text-xs text-muted-foreground flex flex-row gap-1 flex-shrink-0">
            <TimerIcon size={14} />
            <span>{formatDuration(recipe.totalTime)}</span>
          </div>
          <div className="flex flex-row gap-1 flex-wrap flex-1 justify-end">
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
          </div>
        </div>
        <Separator className="mb-4 mt-4 sm:hidden" />
      </Card>
    </RecipePropsProvider>
  );
};

const RecipeCarousel = async ({
  slug,
  priority,
}: {
  slug: string;
  priority: boolean;
}) => {
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
      <div className="h-64 carousel carousel-center overflow-y-hidden space-x-2 flex-1 pl-2 pr-4 sm:p-0 md:justify-center">
        {mediaList.map((media, mediaIndex) => {
          return (
            <Link
              className="carousel-item h-64"
              key={mediaIndex}
              href={`/recipe/${slug}?#media-${mediaIndex}`}
            >
              <Image
                className="rounded-box h-64 w-auto shadow-md hover:shadow-lg"
                src={media.url}
                priority={priority}
                width={media.width}
                height={media.height}
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                alt="Main media"
                placeholder="blur"
                blurDataURL={media.blobDataURL}
                // placeholder="empty"
                // style={{ objectFit: "cover" }}
              />
            </Link>
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

export const RecipeListItemLoading = ({ index }: { index: number }) => {
  return (
    <Card className="flex flex-col gap-3 max-w-2xl w-full mx-auto py-4 rounded-2xl border-none shadow-none sm:border-solid">
      <div className="px-5 flex flex-row justify-between items-center gap-4 w-full mx-auto">
        <div className="flex flex-row gap-3 justify-between items-center w-full">
          <Button variant="ghost" size="icon" disabled>
            {index + 1}.
          </Button>
          <div className="flex flex-col gap-1 flex-1 justify-start items-start">
            <div className="flex-1">
              <SkeletonSentence className="h-6" numWords={[3, 4, 5]} />
            </div>
            <div>
              <Badge
                className="flex flex-row gap-1 items-center"
                variant="outline"
              >
                <ChefHatIcon size={16} />
                <Skeleton className="w-24 h-4" />
              </Badge>
            </div>
          </div>
          <Button
            disabled={true}
            variant="outline"
            className="flex flex-row gap-1"
            aria-label="Upvote"
          >
            <ArrowBigUpDashIcon />
            <span className="font-bold">
              <Skeleton className="w-6 h-4" />
            </span>
          </Button>
          {/* <ShareButton
              slug={recipe.slug}
              name={recipe.name}
              description={recipe.description}
            /> */}
          {/* <Suspense>
            <UpvoteButton
              count={0}
              alreadyVoted={true}
            />
          </Suspense> */}
        </div>
      </div>
      {/* {recipe.mediaCount > 0 ? (
        <div className="h-64 relative">
          <div className="absolute w-screen left-1/2 transform -translate-x-1/2 h-64 flex justify-center z-20">
            <RecipeCarousel slug={recipe.slug} priority={index === 0} />
          </div>
        </div>
      ) : null} */}
      <div className="px-5 flex flex-row gap-4 items-center">
        <div className="flex-1">
          <SkeletonSentence className="h-4" numWords={12} />
        </div>
        <Button size="icon" variant="outline" disabled>
          <ChevronRightIcon />
        </Button>
      </div>
      <div className="flex-1 flex flex-row gap-1 px-4 justify-between items-start">
        <Badge
          className="text-xs text-muted-foreground flex flex-row gap-1 flex-shrink-0"
          variant="outline"
        >
          <TimerIcon size={14} />
          <span>
            <Skeleton className="w-4 h-4" />
          </span>
        </Badge>
        <div className="flex flex-row gap-1 flex-wrap flex-1 justify-end">
          {new Array(3).fill(0).map((_, index) => {
            const widths = [12, 14];
            const randomIndex = Math.floor(Math.random() * widths.length);
            const width = widths[randomIndex];
            return (
              <Badge key={index} variant="secondary">
                <Skeleton className={`w-${width} h-4`} />
              </Badge>
            );
          })}
        </div>
      </div>
      <Separator className="mb-4 mt-4 sm:hidden" />
    </Card>
  );
};
