import { Skeleton } from "@/components/display/skeleton";
import { Button } from "@/components/input/button";
import { QueryStoreState } from "@/lib/query";
import { timeAgo, waitForStoreValue } from "@/lib/utils";
import { kv } from "@vercel/kv";
import { ArrowBigUpIcon } from "lucide-react";
import { MapStore } from "nanostores";
import Image from "next/image";
import Link from "next/link";
import { ReactNode, Suspense } from "react";
import { UploadedMediaSchema } from "../recipe/[slug]/media/schema";
import { getMediaIdSelector, getSlugSelector } from "./selectors";
import { RecipeStore } from "./types";

export const RecipeTimestamp = async <T extends { createdAt: string }[]>({
  store,
  index,
}: {
  store: MapStore<QueryStoreState<T>>;
  index: number;
}) => {
  const createdAt = await waitForStoreValue(store, (state) => {
    const recipe = state.data[index];
    if (recipe || !state.loading) {
      return recipe?.createdAt || null;
    }
  });

  return <>{createdAt ? timeAgo(createdAt) : null}</>;
};

export const RecipeDescription = async <T extends { description: string }[]>({
  store,
  index,
}: {
  store: MapStore<QueryStoreState<T>>;
  index: number;
}) => {
  const description = await waitForStoreValue(store, (state) => {
    const recipe = state.data[index];
    if (!state.loading) {
      return recipe?.description || null;
    }
  });

  return <>{description}</>;
};

export const RecipeName = async <T extends { name: string }[]>({
  store,
  index,
}: {
  store: MapStore<QueryStoreState<T>>;
  index: number;
}) => {
  const name = await waitForStoreValue(store, (state) => {
    const recipe = state.data[index];
    if (!state.loading) {
      return recipe?.name || null;
    }
  });

  return <>{name}</>;
};

export const RecipeLink = <T extends { slug: string }>({
  index,
  store,
  children,
}: {
  index: number;
  store: MapStore<QueryStoreState<T[]>>;
  children: ReactNode;
}) => {
  const Content = async () => {
    const slug = await waitForStoreValue(store, getSlugSelector(index));

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

export const RecipeImage = async <
  T extends { previewMediaIds: string[] }[],
>(props: {
  store: MapStore<QueryStoreState<T>>;
  index: number;
  mediaIndex: number;
}) => {
  const mediaId = await waitForStoreValue(
    props.store,
    getMediaIdSelector(props.index, props.mediaIndex)
  );

  //   (state) => {
  //   const recipe = state.data[props.index];
  //   if (recipe?.previewMediaIds.length) {
  //     return recipe.previewMediaIds[props.mediaIndex] || null;
  //   }

  //   if (!state.loading) return null;
  // });

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

export const RecipeUpvoteButton = ({
  store,
  index,
}: {
  index: number;
  store: RecipeStore;
}) => {
  const Content = async () => {
    const slug = await waitForStoreValue(store, (state) => {
      if (state.data[index] || !state.loading) {
        return state.data[index]?.slug || null;
      }
    });
    const upvotes = await waitForStoreValue(store, (state) => {
      if (state.data[index] || !state.loading) {
        return 0;
      }
    });

    if (!slug || typeof upvotes !== "number") {
      return <></>;
    }

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
        <span>1{/* <UpvoteCounter slug={slug} initial={upvotes} /> */}</span>
      </Button>
    );
  };

  return (
    <Suspense fallback={<></>}>
      <Content />
    </Suspense>
  );
};
