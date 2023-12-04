import { Skeleton } from "@/components/display/skeleton";
import { Button } from "@/components/input/button";
import { getSession } from "@/lib/auth/session";
import { ChevronRightIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ReactNode, Suspense } from "react";
import { Observable, lastValueFrom } from "rxjs";
import { upvote } from "../recipe/actions";
import { RecipePropsProvider } from "../recipe/context";
import { getSortedMediaForRecipe, getTopRecipes } from "./queries";
import { UpvoteButton } from "../recipe/components.client";

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
        <Link key={index} href={`/recipe/${recipe.slug}`}>
          <div className="w-full h-64 flex flex-row gap-4 relative">
            <Button
              className="absolute bottom-3 left-2 z-50"
              variant="outline"
              size="icon"
            >
              {index + 1}.
            </Button>
            <div className="absolute bottom-3 right-2 z-50">
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
          <div className="px-5 flex flex-row gap-3 items-center">
            <div className="flex-1">
              <h2 className="font-semibold text-lg">{recipe.name}</h2>
              <p>{recipe.description}</p>
            </div>
            <Button size="icon" variant="outline">
              <ChevronRightIcon />
            </Button>
          </div>
        </Link>
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
