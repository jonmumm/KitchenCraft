import { Card } from "@/components/display/card";
import { Skeleton } from "@/components/display/skeleton";
import { Button } from "@/components/input/button";
import { getMyRecentRecipes } from "@/lib/db";
import { timeAgo, waitForStoreValue } from "@/lib/utils";
import { kv } from "@vercel/kv";
import { ArrowBigUpIcon, ChevronRightIcon } from "lucide-react";
import { map } from "nanostores";
import Image from "next/image";
import Link from "next/link";
import { ReactNode, Suspense } from "react";
import { UploadedMediaSchema } from "../recipe/[slug]/media/schema";
import { UpvoteCounter } from "./components.client";
import { RecipeStore } from "./types";

export const RecipeTimestamp = async ({
  store,
  index,
}: {
  store: RecipeStore;
  index: number;
}) => {
  const createdAt = await waitForStoreValue(store, (state) => {
    const recipe = state.recipes[index];
    if (!state.loading) {
      return recipe.createdAt || null;
    }
  });

  return <>{createdAt ? timeAgo(createdAt) : null}</>;
};

export const RecipeDescription = async ({
  store,
  index,
}: {
  store: RecipeStore;
  index: number;
}) => {
  const description = await waitForStoreValue(store, (state) => {
    const recipe = state.recipes[index];
    if (!state.loading) {
      return recipe?.description || null;
    }
  });

  return <>{description}</>;
};

export const RecipeName = async ({
  store,
  index,
}: {
  store: RecipeStore;
  index: number;
}) => {
  const name = await waitForStoreValue(store, (state) => {
    const recipe = state.recipes[index];
    if (!state.loading) {
      return recipe?.name || null;
    }
  });

  return <>{name}</>;
};

export const RecipeLink = (props: {
  index: number;
  store: RecipeStore;
  children: ReactNode;
}) => {
  const Content = async () => {
    const slug = await waitForStoreValue(props.store, (state) => {
      if (!state.loading) {
        return state.recipes[props.index]?.slug || null;
      }
    });

    return (
      <Link
        href={slug ? `/recipe/${slug}` : "/?gallery"}
        className="flex flex-col gap-1"
      >
        {props.children}
      </Link>
    );
  };

  return (
    <Suspense fallback={<>{props.children}</>}>
      <Content />
    </Suspense>
  );
};

export const RecipeImage = async (props: {
  store: RecipeStore;
  index: number;
  mediaIndex: number;
}) => {
  const mediaId = await waitForStoreValue(props.store, (state) => {
    const recipe = state.recipes[props.index];
    if (recipe?.previewMediaIds.length) {
      return recipe.previewMediaIds[props.mediaIndex] || null;
    }

    if (!state.loading) return null;
  });

  if (mediaId) {
    const media = UploadedMediaSchema.parse(
      await kv.hgetall(`media:${mediaId}`)
    );

    return (
      <Image
        className="w-72 aspect-square"
        src={media.url}
        // layoutId={`${media.id}-${index}`}
        priority={props.index < 2 && props.mediaIndex == 0}
        width={media.metadata.width}
        height={media.metadata.width}
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        alt="Main media"
        style={{ objectFit: "cover" }}
      />
    );
  } else {
    return <Skeleton className="w-72 aspect-square" />;
  }
};

export const MyReceiptRecipes = () => {
  // const recipes = await getMyRecentRecipes(kv);
  const store: RecipeStore = map({
    loading: true,
    recipes: [],
  });

  getMyRecentRecipes(kv).then((recipes) => {
    store.set({
      error: undefined,
      loading: false,
      recipes,
    });
  });

  // getMyRecentRecipes(kv).then((recipes) => {
  //   console.log({ recipes });
  // });

  // getRecentRecipes(kv).then((recipes) => {
  //   store.set({
  //     loading: false,
  //     recipes,
  //   });
  // });

  // getMyRecentRecipes(kv).then((recipes) => {
  //   store.set({
  //     loading: false,
  //     recipes,
  //   });
  // });

  const items = new Array(6).fill(0);

  return (
    <>
      {items.map((_, index) => {
        return (
          <div key={index} className="carousel-item">
            <Suspense fallback={<Skeleton className="w-64 h-36" />}>
              <RecipeLink index={index} store={store}>
                <Card className="w-64 h-36 bg-secondary flex flex-col gap-1 justify-between py-2">
                  <div className="flex flex-row gap-1 px-3 items-center">
                    <h3 className="text-lg font-semibold flex-1">
                      <RecipeName store={store} index={index} />
                    </h3>
                    <Button size="icon" variant="outline">
                      <ChevronRightIcon />
                    </Button>
                  </div>
                  <div className="line-clamp-2 text-xs text-muted-foreground leading-5 px-3">
                    <RecipeDescription store={store} index={index} />
                  </div>
                  <div className="text-xs text-muted-foreground px-3">
                    <RecipeTimestamp store={store} index={index} />
                  </div>
                </Card>
              </RecipeLink>
            </Suspense>
          </div>
        );
      })}
    </>
  );
};

export const RecipeUpvoteButton = ({
  store,
  index,
}: {
  index: number;
  store: RecipeStore;
}) => {
  const Content = async () => {
    const slug = await waitForStoreValue(store, (state) => {
      if (state.recipes[index] || !state.loading) {
        return state.recipes[index]?.slug || null;
      }
    });
    const upvotes = await waitForStoreValue(store, (state) => {
      if (state.recipes[index] || !state.loading) {
        return 0;
      }
    });

    if (!slug || typeof upvotes !== "number") {
      return <></>;
    }

    // if (!slug) {
    //   return null;
    // }

    // if (upvotes === undefined) {
    //   return null;
    // }

    return (
      <Button
        event={{
          type: "UPVOTE",
          slug,
        }}
        variant="outline"
        className="absolute right-2 bottom-3 z-50"
      >
        <ArrowBigUpIcon />
        <span>1</span>
      </Button>
    );
  };

  return (
    <Suspense fallback={<></>}>
      <Content />
    </Suspense>
  );
};
