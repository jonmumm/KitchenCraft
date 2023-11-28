import { Skeleton } from "@/components/display/skeleton";
import { Button } from "@/components/input/button";
import { RecipeSchema } from "@/schema";
import { Recipe } from "@/types";
import { kv } from "@vercel/kv";
import { map } from "nanostores";
import { Suspense } from "react";
import { Subject, concatMap, from } from "rxjs";
import {
  RecipeDescription,
  RecipeImage,
  RecipeLink,
  RecipeName,
  RecipeUpvoteButton,
} from "./components";
import { RecipeStore } from "./types";
import { ChevronRightIcon } from "lucide-react";

// export const dynamic = "force-dynamic";

export default async function Page({
  searchParams,
}: {
  searchParams: Record<string, string>;
}) {
  const items = new Array(30).fill(0);

  const store: RecipeStore = map({
    loading: true,
    error: undefined,
    recipes: [],
  });

  const loader = new Subject<Recipe>();

  (async () => {
    const dataArray = await kv.zrange(`recipes:new`, 0, -1, {
      rev: true,
      withScores: true,
    });

    const recipes = [];
    for (let i = 0; i < dataArray.length; i += 2) {
      recipes.push({
        slug: dataArray[i],
        createdAt: dataArray[i + 1],
      });
    }

    const observable = from(
      recipes.map((recipe) => {
        return new Promise<Recipe>((resolve) => {
          kv.hgetall(`recipe:${recipe.slug}`).then((data) => {
            resolve(RecipeSchema.parse(data));
          });
        });
      })
    );

    observable.pipe(concatMap((promise) => promise)).subscribe({
      next: (result) => {
        loader.next(result);
      },
      error: (err) => {
        console.error(err);
      },
      complete() {
        loader.complete();
      },
    });
  })();

  loader.subscribe({
    next(recipe) {
      store.setKey("recipes", [...store.get().recipes, recipe]);
    },
    error(err) {
      store.setKey("error", err);
    },
    complete() {
      store.setKey("loading", false);
    },
  });

  const RecipeListItem = async ({ index }: { index: number }) => {
    const mediaItems = new Array(8).fill(0);

    return (
      <RecipeLink index={index} store={store}>
        <div className="w-full h-64 flex flex-row gap-4 relative">
          <Button
            className="absolute bottom-3 left-2 z-50"
            variant="outline"
            size="icon"
          >
            {index + 1}.
          </Button>
          {/* <RecipeUpvoteButton index={index} store={store} /> */}
          <div className="carousel carousel-center space-x-2 flex-1 px-4">
            {mediaItems.map((item, mediaIndex) => {
              return (
                <div key={mediaIndex} className="carousel-item">
                  <Suspense fallback={<Skeleton className="w-64 aspect-square" />}>
                    <RecipeImage
                      store={store}
                      index={index}
                      mediaIndex={mediaIndex}
                    />
                  </Suspense>
                </div>
              );
            })}
          </div>
        </div>
        <div className="px-5 flex flex-row gap-3 items-center">
          <div className="flex-1">
            <h2 className="font-semibold text-lg">
              <Suspense fallback={<Skeleton className="w-full h-7" />}>
                <RecipeName store={store} index={index} />
              </Suspense>
            </h2>
            <Suspense
              fallback={
                <div className="flex flex-col gap-2">
                  <Skeleton className="w-full h-8" />
                  <Skeleton className="w-full h-8" />
                  <Skeleton className="w-full h-8" />
                </div>
              }
            >
              <p>
                <RecipeDescription store={store} index={index} />
              </p>
            </Suspense>
          </div>
          <Button size="icon" variant="outline">
            <ChevronRightIcon />
          </Button>
        </div>
      </RecipeLink>
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
