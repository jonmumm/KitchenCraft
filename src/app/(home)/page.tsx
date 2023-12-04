import { Badge } from "@/components/display/badge";
import { Skeleton } from "@/components/display/skeleton";
import { Button } from "@/components/input/button";
import { getSession } from "@/lib/auth/session";
import { formatDuration, sentenceToSlug } from "@/lib/utils";
import { ChevronRightIcon, TimerIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ReactNode, Suspense } from "react";
import { Observable, lastValueFrom } from "rxjs";
import { upvote } from "../recipe/actions";
import { UpvoteButton } from "../recipe/components.client";
import { RecipePropsProvider } from "../recipe/context";
import { getSortedMediaForRecipe, getTopRecipes } from "./queries";

// export const dynamic = "force-dynamic";
export default async function Page({
  searchParams,
}: {
  searchParams: Record<string, string>;
}) {
  const items = new Array(30).fill(0);
  const session = await getSession();
  const userId = session?.user.id;
  const query = await getTopRecipes(session?.user.id);

  const requireLogin = async () => {
    "use server";

    redirect("/auth/signin");
  };
  // const query$ = from(getTopRecipes(session?.user.id));

  const RecipeListItem = ({ index }: { index: number }) => {
    const recipe = query[index];
    if (!recipe) {
      return null;
    }
    const href = `/recipe/${recipe.slug}`;
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
            <div className="w-full h-64 flex flex-row gap-4 relative">
              <div className="absolute bottom-3 left-2 right-2 z-50 flex flex-row justify-between items-center gap-3">
                <Button variant="outline" size="icon">
                  {index + 1}.
                </Button>

                <UpvoteButton count={1} />
              </div>

              <RecipeCarousel slug={recipe.slug} />
              {/* <div className="carousel carousel-center space-x-2 flex-1 px-4">
            {mediaItems.map((item, mediaIndex) => {
              return (
                <div key={mediaIndex} className="carousel-item">
                  <Suspense
                    fallback={<Skeleton className="w-64 aspect-square" />}
                  >
                    <RecipeImage
                      store={store}
                      index={index}
                      mediaIndex={mediaIndex}
                    />
                  </Suspense>
                </div>
              );
            })}
          </div> */}
            </div>
          </Link>
          <div className="px-5 flex flex-row justify-between items-center gap-4">
            <Link href={href}>
              <h2 className="font-semibold text-lg flex-1">{recipe.name}</h2>
            </Link>
            <Link href="/@inspectorT">
              <Badge variant="secondary" className="float-right">
                <span>@inspectorT</span>
                {/* <span className="text-muted-foreground">(+1048 🧪)</span> */}
              </Badge>
            </Link>
          </div>
          <Link href={href}>
            <div className="px-5 flex flex-row gap-4 items-center">
              <p className="flex-1">{recipe.description}</p>
              <Button size="icon" variant="outline">
                <ChevronRightIcon />
              </Button>
            </div>
          </Link>
          <div className="w-full px-5 flex flex-row justify-between items-center">
            <Badge
              className="text-xs text-muted-foreground flex flex-row gap-1"
              variant="outline"
            >
              <TimerIcon size={14} />
              <span>{formatDuration(recipe.totalTime)}</span>
            </Badge>
            <div className="flex-1 flex flex-row gap-1 flex-wrap justify-end">
              {recipe.tags.map((tag) => (
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

  return (
    <div className="flex flex-col gap-8">
      {items.map((_, index) => (
        <RecipeListItem key={index} index={index} />
      ))}
    </div>
  );
}
// interface RecipeTimestampProps {
//   observable: Observable<{ createdAt: string }>;
// }

// const RecipeTimestamp = async ({ observable }: RecipeTimestampProps) => {
//   const state = await lastValueFrom(observable);
//   const createdAt = state.createdAt;

//   return <>{createdAt ? timeAgo(createdAt) : null}</>;
// };

interface RecipeDescriptionProps {
  observable: Observable<{ description: string } | undefined>;
}

const RecipeDescription = async ({ observable }: RecipeDescriptionProps) => {
  const state = await lastValueFrom(observable);
  const description = state?.description;

  return <>{description}</>;
};

interface RecipeNameProps {
  observable: Observable<{ name: string } | undefined>;
}

interface RecipeCarouselProps {
  observable: Observable<{ slug: string; name: string } | undefined>;
}

const RecipeCarousel = async ({ slug }: { slug: string }) => {
  const items = new Array(6).fill(0);

  const Loader = async () => {
    return (
      <>
        {items.map((_, index) => {
          return (
            <div className="carousel-item" key={index}>
              <Skeleton className="w-72 aspect-square" />
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
            return (
              <div className="carousel-item" key={index}>
                <Skeleton className="w-72 aspect-square" />
              </div>
            );
          }

          return (
            <div className="carousel-item" key={index}>
              <Image
                className="w-72 aspect-square"
                src={media.url}
                priority={index === 0}
                width={media.width}
                height={media.height}
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                alt="Main media"
                style={{ objectFit: "cover" }}
              />
            </div>
          );
        })}
      </>
    );
  };

  return (
    <div className="carousel carousel-center overflow-y-hidden space-x-2 flex-1 px-4">
      <Suspense fallback={<Loader />}>
        <Content />
      </Suspense>
    </div>
  );
};

interface RecipeLinkProps {
  observable: Observable<{ slug: string } | undefined>;
  children: ReactNode;
}

const RecipeLink = ({ observable, children }: RecipeLinkProps) => {
  const Content = async () => {
    const state = await lastValueFrom(observable);
    const slug = state?.slug;

    return (
      <Link
        href={slug ? `/recipe/${slug}` : "/?gallery"}
        className="flex flex-col gap-1"
      >
        {children}
      </Link>
    );
  };

  return (
    <Suspense fallback={<>{children}</>}>
      <Content />
    </Suspense>
  );
};
