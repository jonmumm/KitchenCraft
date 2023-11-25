import { Label } from "@/components/ui/label";
import { getRecentRecipeSlugs, getRecentRecipes } from "@/lib/db";
import { RecipeSlug } from "@/types";
import { kv } from "@vercel/kv";
import { ArrowBigUpIcon, ChevronRightIcon } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { z } from "zod";

import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { Skeleton } from "../ui/skeleton";
import { getRecipe } from "@/app/recipe/[slug]/utils";
import Image from "next/image";
import { UploadedMedia } from "@/app/recipe/[slug]/media/types";
import { UploadedMediaSchema } from "@/app/recipe/[slug]/media/schema";
import { Badge } from "../ui/badge";
import {
  ImageCarousel,
  ImageCarouselItem,
  RecipeCardButton,
  RecipeLink,
} from "./components.client";
import { Swiper, SwiperSlide } from "swiper/react";

export async function RecentRecipes() {
  const recipes = await getRecentRecipes(kv);

  const Item = ({ index }: { index: number }) => {
    return (
      <>
        {recipes[index] ? (
          <Suspense fallback={<Skeleton className="w-full h-40" />}>
            <RecipeCard
              key={index}
              index={index}
              recipe={recipes[index]!}
              slug={recipes[index]?.slug!}
            />
          </Suspense>
        ) : (
          <Card key={index}>
            <Skeleton className="w-full h-20" />
          </Card>
        )}
      </>
    );
  };

  return (
    <div className="p-4">
      <Label className="text-xs uppercase font-semibold">New Recipes</Label>
      <ul className="flex flex-col gap-2 mt-1">
        {/* <div className="w-full h-40 overflow-hidden">
          <ResponsiveAd slotId={"4156907864"} />
        </div> */}

        {/* <div className="w-80 h-20 bg-blue-300">
          <AdSenseAd
            adClient="ca-pub-9096699111782321"
            adSlot="2756180374"
            adFormat="fluid"
            adLayoutKey="-i5-f+2e-23-1h"
          />
        </div> */}
        {new Array(30).fill(0).map((_, index) => (
          <Item key={index} index={index} />
        ))}
      </ul>
    </div>
  );
}

async function RecipeCard(props: {
  slug: RecipeSlug;
  index: number;
  recipe: Awaited<ReturnType<typeof getRecipe>>;
}) {
  // const recipe = await getRecipe(props.slug);

  const mainMediaId = props.recipe.previewMediaIds[0];
  let mainMedia: UploadedMedia | undefined;
  if (mainMediaId) {
    console.log({ mainMediaId });
    mainMedia = UploadedMediaSchema.parse(
      await kv.hgetall(`media:${mainMediaId}`)
    );
  }

  const ImageCarouselItemLoader = async ({ id }: { id: string }) => {
    const media = UploadedMediaSchema.parse(await kv.hgetall(`media:${id}`));
    return <ImageCarouselItem media={media} recipeName={props.recipe.name} />;
  };

  const ImageCarouselItems = () => {
    return (
      <>
        {props.recipe.previewMediaIds.slice(1).map((id) => (
          <ImageCarouselItemLoader key={id} id={id} />
        ))}
      </>
    );
  };

  return (
    <li className="flex flex-row flex-1 gap-1">
      <div className="flex flex-col gap-1 items-center justify-between">
        <Link href={`/recipe/${props.slug}`}>
          <Button variant="ghost" className="w-16 h-12 font-bold text-lg">
            {props.index + 1}.
          </Button>
        </Link>
        <Button variant="outline" className="w-16 h-12 flex flex-row gap-1">
          <ArrowBigUpIcon />
          <span>1</span>
        </Button>
      </div>
      <Card className="flex flex-row gap-2 items-center justify-between overflow-hidden">
        <div className="h-full flex flex-col gap-1">
          {mainMedia && (
            <div className="w-full aspect-square relative overflow-hidden">
              {/* <ImageCarousel></ImageCarousel> */}

              {/* <ImageCarousel>
                <ImageCarouselItem
                  recipeName={props.recipe.name}
                  media={mainMedia}
                />
                <ImageCarouselItem
                  recipeName={props.recipe.name}
                  media={mainMedia}
                /> */}
              {/* <Suspense fallback={<></>}>
                  <ImageCarouselItems />
                </Suspense> */}
              {/* </ImageCarousel> */}
              <Image
                src={mainMedia.url}
                priority
                width={mainMedia.metadata.width}
                height={mainMedia.metadata.width}
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                alt={props.recipe.name}
                style={{ objectFit: "fill" }}
              />
              {/* <Image
                alt={`${props.recipe.name} - Image 1`}
                src={mainMedia.url}
                width={mainMedia.metadata.width}
                height={mainMedia.metadata.height}
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                style={{
                  width: "100%",
                  position: "absolute",
                  top: "50%",
                  transform: "translateY(-50%)",
                }}
              /> */}
              {/* {recipe.mediaCount > 1 && (
                <Badge className="absolute right-3 top-2 shadow-md">
                  1/{recipe.mediaCount}
                </Badge>
              )} */}

              {/* <div className="absolute bottom-0 left-0 w-full px-3 pb-2 pt-8 bg-gradient-to-b from-transparent to-card">
                <h2 className="font-medium text-lg">{recipe.name}</h2>
              </div> */}
            </div>
          )}
          <RecipeLink
            className="w-full block flex-1"
            href={`/recipe/${props.slug}`}
          >
            <div className="px-3 py-2">
              <h2 className="font-medium text-lg">{props.recipe.name}</h2>
              <p className="text-sm text-secondary-foreground">
                {props.recipe.description}
              </p>
              <div className="flex-1 flex flex-row items-center justify-between">
                <p className="flex-1 text-sm text-muted-foreground">
                  3 hours ago
                </p>
                <RecipeCardButton />
              </div>
            </div>
          </RecipeLink>
        </div>
      </Card>
    </li>
  );
}

const RecipeNamePlaceholder = () => {
  return <Skeleton className="w-14 h-6" />;
};

export const RecentRecipeName = async ({ slug }: { slug: string }) => {
  // todo cache this...
  const name = await kv.hget(`recipe:${slug}`, "name");
  return <>{name}</>;
};

const RecipeDescriptionPlaceholder = () => {
  return <Skeleton className="w-full h-14" />;
};

export const RecentRecipeDescription = async ({ slug }: { slug: string }) => {
  const description = z
    .string()
    .parse(await kv.hget(`recipe:${slug}`, "description"));
  return <p className="text-sm text-secondary-foreground">{description}</p>;
};
