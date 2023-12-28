import { Card } from "@/components/display/card";
import { twc } from "react-twc";
import { Skeleton } from "@/components/display/skeleton";
import { AsyncRenderFirstValue } from "@/components/util/async-render-first-value";
import { db } from "@/db";
import { getPopularTags } from "@/db/queries";
import { cn, sentenceToSlug } from "@/lib/utils";
import { ChefHatIcon } from "lucide-react";
import Link from "next/link";
import { filter, from, map, shareReplay, take } from "rxjs";
import { Separator } from "@/components/display/separator";
import { Badge } from "@/components/display/badge";

const DEFAULT_NUM_ITEMS = 30;

export const TagsCarousel = ({ currentTag }: { currentTag: string }) => {
  const tags$ = from(getPopularTags(db)).pipe(shareReplay(1));

  const arr = new Array(DEFAULT_NUM_ITEMS).fill(0);

  const selectedClass = `border-0 border-b-4 border-b-solid border-b-blue-500`;

  const CurrentCard = () => (
    <AsyncRenderFirstValue
      render={(items) => {
        const tags = items.map(({ tag }) => tag);
        const isPopularTag = tags.includes(currentTag);
        return currentTag !== "All" && !isPopularTag ? (
          <>
            <TagItemCard className={selectedClass}>
              <Badge
                className="text-muted-foreground text-xs truncate w-full"
                variant="outline"
              >
                {currentTag}
              </Badge>
            </TagItemCard>
            <Separator orientation="vertical" />
          </>
        ) : null;
      }}
      observable={tags$}
      fallback={<TagItemPlaceholder />}
    />
  );

  const AllCard = () => (
    <AsyncRenderFirstValue
      render={() => {
        return (
          <TagItemCard
            className={cn(currentTag === "All" ? selectedClass : `border-none`)}
          >
            <Link href="/" className="flex flex-col justify-between items-center">
              <Badge variant="outline">All</Badge>
            </Link>
          </TagItemCard>
        );
      }}
      observable={tags$}
      fallback={<TagItemPlaceholder />}
    />
  );

  return (
    <div className="flex w-full">
      <div className="carousel carousel-center px-2">
        <CurrentCard />
        <AllCard />
        {arr.map((_, index) => {
          const observable = tags$.pipe(
            filter((items) => {
              return !!items[index];
            }),
            map((items) => items[index]?.tag!),
            take(1)
          );

          return (
            <AsyncRenderFirstValue
              key={index}
              observable={observable}
              render={(tag) => {
                const isSelected = currentTag === tag;
                return (
                  <TagItemCard className={isSelected ? selectedClass : ``}>
                    <Link
                      href={`/tag/${sentenceToSlug(tag)}`}
                      className="flex flex-col gap-2 items-center justify-between"
                    >
                      <Badge variant="outline">{tag}</Badge>
                    </Link>
                  </TagItemCard>
                );
              }}
              fallback={<TagItemPlaceholder />}
            />
          );
        })}
      </div>
    </div>
  );
};

export const TagsCarouselPlaceholder = () => {
  const arr = new Array(DEFAULT_NUM_ITEMS).fill(0);

  return (
    <div className="flex w-full">
      <div className="carousel carousel-center px-2">
        {arr.map((_, index) => {
          return <TagItemPlaceholder key={index} />;
        })}
      </div>
    </div>
  );
};

export const TagItemCard = twc(
  Card
)`carousel-item py-2 px-2 shadow-none text-center flex flex-col gap-1 items-center justify-between rounded-none border-0`;

const TagItemPlaceholder = () => {
  return (
    <TagItemCard>
      <Badge variant="outline">
        <Skeleton className="w-12 h-2" />
      </Badge>
    </TagItemCard>
  );
};
