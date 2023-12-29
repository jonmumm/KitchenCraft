import { Badge } from "@/components/display/badge";
import { Card } from "@/components/display/card";
import { Separator } from "@/components/display/separator";
import { Skeleton } from "@/components/display/skeleton";
import { AsyncRenderFirstValue } from "@/components/util/async-render-first-value";
import { db } from "@/db";
import { getPopularTags } from "@/db/queries";
import { cn, sentenceToSlug } from "@/lib/utils";
import Link from "next/link";
import { twc } from "react-twc";
import { defaultIfEmpty, filter, from, map, shareReplay, take } from "rxjs";
import CarouselScroller from "./componets.client";
import { useRef } from "react";

const DEFAULT_NUM_ITEMS = 30;

export const TagsCarousel = ({
  currentTag,
  root = "",
  query = getPopularTags(db),
  showCount = false,
}: {
  currentTag: string;
  root?: string;
  query?: Promise<{ tag: string; count: number }[]>;
  showCount?: boolean;
}) => {
  const tags$ = from(query).pipe(shareReplay(1));
  const arr = new Array(DEFAULT_NUM_ITEMS).fill(0);

  const selectedClass = `border-0 border-b-4 border-b-solid border-b-blue-500`;

  const CurrentCard = () => (
    <AsyncRenderFirstValue
      render={(items) => {
        const tags = items.map(({ tag }) => tag);
        const isPopularTag = tags.includes(currentTag);
        return currentTag !== "All" && !isPopularTag ? (
          <>
            <TagItemCard className={selectedClass} data-tag={currentTag}>
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
            data-tag="All"
          >
            <Link
              href={root + "/"}
              className="flex flex-col justify-between items-center"
            >
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
      <CarouselScroller currentTag={currentTag} />
      <div id="tag-carousel" className="carousel carousel-center px-2">
        <CurrentCard />
        <AllCard />
        {arr.map((_, index) => {
          const observable = tags$.pipe(
            filter((items) => {
              return !!items[index];
            }),
            map((items) => items[index]),
            take(1),
            defaultIfEmpty(undefined)
          );

          return (
            <AsyncRenderFirstValue
              key={index}
              observable={observable}
              render={(item) => {
                if (!item) {
                  return (
                    <TagItemCard>
                      <div className="flex flex-col justify-center">
                        <Badge variant="outline">
                          <Skeleton animation="none" className="w-12 h-4" />
                        </Badge>
                      </div>
                    </TagItemCard>
                  );
                }

                const { tag, count } = item;
                const isSelected = currentTag === tag;
                return (
                  <TagItemCard
                    className={isSelected ? selectedClass : ``}
                    data-tag={tag}
                  >
                    <Link
                      href={root + `/tag/${sentenceToSlug(tag)}`}
                      className="flex flex-col gap-2 items-center justify-between"
                    >
                      <Badge variant="outline">
                        {showCount ? `${tag} (${count})` : tag}
                      </Badge>
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
