import { Skeleton } from "@/components/display/skeleton";
import { formatDuration, sentenceToSlug } from "@/lib/utils";
import { ClockIcon, TagIcon } from "lucide-react";
import { Suspense } from "react";

import { Badge } from "@/components/display/badge";
import { Label } from "@/components/display/label";
import { RenderFirstValue } from "@/components/util/render-first-value";
import { getProfileByUserId, getUserLifetimePoints } from "@/db/queries";
import { getObservableAtIndex, getTokenObservableAtIndex } from "@/lib/rxjs";
import { notUndefined } from "@/lib/type-guards";
import { ChefHatIcon } from "lucide-react";
import Link from "next/link";
import {
  Observable,
  defaultIfEmpty,
  filter,
  firstValueFrom,
  from,
  lastValueFrom,
  map,
  shareReplay,
  take,
} from "rxjs";
import { LinkFromFirstValue } from "@/components/util/link-from-first-value";

export function CraftingDetails({
  createdAt,
  createdBy,
}: {
  createdAt: string;
  createdBy: string;
}) {
  const profile$ = from(getProfileByUserId(createdBy)).pipe(
    shareReplay(1),
    filter(notUndefined)
  );
  const profileSlug$ = profile$.pipe(map((p) => `/@${p.profileSlug}`));
  const points$ = from(getUserLifetimePoints(createdBy)).pipe(shareReplay(1));

  const date = new Date(createdAt);
  const formattedDate = new Intl.DateTimeFormat("en-US", {
    dateStyle: "full",
    timeStyle: "short",
  }).format(date);

  return (
    <>
      <Label className="uppercase text-xs font-bold text-accent-foreground">
        Crafted By
      </Label>

      <LinkFromFirstValue
        className="flex flex-row gap-1 items-center"
        observable={profileSlug$}
        fallbackUrl={"/"}
      >
        <Badge variant="outline">
          <h3 className="font-bold text-xl">
            <div className="flex flex-col gap-1 items-center">
              <div className="flex flex-row gap-1 items-center">
                <ChefHatIcon />
                <span>
                  <span className="underline">
                    <Suspense fallback={<Skeleton className="w-16 h-7" />}>
                      <RenderFirstValue
                        observable={profile$}
                        render={(profile) => {
                          return <>{profile.profileSlug}</>;
                        }}
                      />
                    </Suspense>
                  </span>
                </span>
              </div>
            </div>
          </h3>
        </Badge>{" "}
        <span className="font-bold">
          (+
          <RenderFirstValue
            observable={points$}
            render={(value) => <>{value}</>}
          />{" "}
          🧪)
        </span>
      </LinkFromFirstValue>
      <Label className="text-muted-foreground uppercase text-xs">
        {formattedDate.split(" at ").join(" @ ")}
      </Label>
    </>
  );
}

export const Times = ({
  cookTime$,
  totalTime$,
  activeTime$,
}: {
  cookTime$: Observable<string>;
  totalTime$: Observable<string>;
  activeTime$: Observable<string>;
}) => {
  // const store = useContext(RecipeViewerContext);
  // const { prepTime, cookTime, totalTime } = useStore(store, {
  //   keys: ["prepTime", "cookTime", "totalTime"],
  // });

  const ActiveTime = async () => {
    const activeTime = await lastValueFrom(activeTime$);
    return <>{formatDuration(activeTime)}</>;
  };

  const CookTime = async () => {
    const cookTime = await lastValueFrom(cookTime$);
    return <>{formatDuration(cookTime)}</>;
  };

  const TotalTime = async () => {
    const totalTime = await lastValueFrom(totalTime$);
    return <>{formatDuration(totalTime)}</>;
  };

  return (
    <div className="flex flex-row gap-2 px-5 py-2 items-center justify-center">
      <ClockIcon className="h-5" />
      <div className="flex flex-row gap-1">
        <Badge variant="secondary" className="inline-flex flex-row gap-1 px-2">
          <span className="font-normal">Cook </span>
          <Suspense fallback={<Skeleton className="w-10 h-4" />}>
            <CookTime />
          </Suspense>
        </Badge>
        <Badge variant="secondary" className="inline-flex flex-row gap-1 px-2">
          <span className="font-normal">Active </span>
          <Suspense fallback={<Skeleton className="w-10 h-4" />}>
            <ActiveTime />
          </Suspense>
        </Badge>
        <Badge variant="secondary" className="inline-flex flex-row gap-1 px-2">
          <span className="font-normal">Total </span>
          <Suspense fallback={<Skeleton className="w-10 h-4" />}>
            <TotalTime />
          </Suspense>
        </Badge>
      </div>
    </div>
  );
};
export const Tags = ({ tags$ }: { tags$: Observable<string[]> }) => {
  const items = new Array(3).fill(0);

  const Tag = async ({ index }: { index: number }) => {
    const tag = await lastValueFrom(getObservableAtIndex(index, tags$));
    return (
      <>
        {tag ? (
          <Link href={`/tag/${sentenceToSlug(tag)}`}>
            <Badge
              variant="outline"
              className="inline-flex flex-row gap-1 px-2"
            >
              {tag}
            </Badge>
          </Link>
        ) : null}
      </>
    );
  };

  return (
    <div className="flex flex-row flex-wrap gap-2 px-5 px-y hidden-print items-center justify-center">
      <TagIcon className="h-5" />
      {items.map((_, index) => {
        return (
          <Suspense
            key={`tag-${index}`}
            fallback={<Skeleton className="w-14 h-4" />}
          >
            <Tag index={index} />
          </Suspense>
        );
      })}
      {/* <AddTagButton /> */}
    </div>
  );
};

export async function Ingredients({
  ingredients$,
}: {
  ingredients$: Observable<string[]>;
}) {
  const MAX_NUM_LINES = 30;
  const NUM_LINE_PLACEHOLDERS = 5;
  const items = new Array(MAX_NUM_LINES).fill(0);

  const Token = async ({
    index,
    itemIndex,
  }: {
    index: number;
    itemIndex: number;
  }) => {
    const token = await firstValueFrom(
      getTokenObservableAtIndex(index, itemIndex, ingredients$)
    );
    return token ? <>{token} </> : null;
  };

  const Item = async ({ index }: { index: number }) => {
    const renderItem = await firstValueFrom(
      ingredients$.pipe(
        filter((items) => !!items?.[index]),
        map((items) => !!items?.[index]),
        take(1),
        defaultIfEmpty(false)
      )
    );

    const MAX_NUM_TOKENS_PER_ROW = 80;
    const NUM_PLACEHOLDERS_TOKENS = 5;
    const tokens = new Array(MAX_NUM_TOKENS_PER_ROW).fill(0);

    return renderItem ? (
      <li>
        <span className="flex flex-row gap-1 flex-wrap">
          {tokens.map((_, tokenIndex) => {
            return (
              <Suspense
                fallback={
                  tokenIndex < NUM_PLACEHOLDERS_TOKENS ? (
                    <Skeleton className="w-10 h-4" />
                  ) : null
                }
                key={tokenIndex}
              >
                <Token index={tokenIndex} itemIndex={index} />
              </Suspense>
            );
          })}
        </span>
      </li>
    ) : null;
  };

  return (
    <>
      {items.map((_, index) => {
        return (
          <Suspense
            key={index}
            fallback={
              index < NUM_LINE_PLACEHOLDERS ? (
                <Skeleton className="w-full h-5" />
              ) : null
            }
          >
            <Item index={index} />
          </Suspense>
        );
      })}
    </>
  );
}

export async function Instructions({
  instructions$,
}: {
  instructions$: Observable<string[]>;
}) {
  const MAX_NUM_LINES = 30;
  const NUM_LINE_PLACEHOLDERS = 5;
  const items = new Array(MAX_NUM_LINES).fill(0);

  // const Token = async ({
  //   index,
  //   itemIndex,
  // }: {
  //   index: number;
  //   itemIndex: number;
  // }) => {
  //   const nextItemExists$ = instructions$.pipe(
  //     map((items) => {
  //       return items[itemIndex + 1];
  //     }),
  //     filter(notUndefined)
  //   );
  //   firstValueFrom(instructions$.pipe(identity)).then((ninit) => {
  //     console.log("INSTRUCTIONS INIT", ninit);
  //   });

  //   const isDone$ = combineLatest([instructions$, nextItemExists$]);

  //   // const isDone$ = of(1);
  //   const token = await firstValueFrom(
  //     getObservableAtIndex(itemIndex, instructions$).pipe(
  //       filter(notUndefined),
  //       map((item) => {
  //         const tokens = item.split(" ");
  //         const token = tokens?.[index]; // Directly return the current token
  //         return token;
  //       }),
  //       takeUntil(isDone$),
  //       // tap((token) => console.log(token)),
  //       defaultIfEmpty(undefined)
  //     )
  //   );
  //   // if (index < 5) {
  //   //   console.log({ token, index, itemIndex });
  //   // }

  //   return token ? <>{token} </> : null;
  // };

  const Item = async ({ index }: { index: number }) => {
    // const isDone$ = await firstValueFrom(
    //   instructions$.pipe(
    //     filter((items) => !!items?.[index + 1]),
    //     defaultIfEmpty(false)
    //   )
    // );
    // const isDone$ = instructions$.pipe(
    //   filter((items) => !!items?.[index + 1]),
    //   first(),
    //   defaultIfEmpty(true)
    // );

    // const nextItemReady$ = instructions$.pipe(
    //   takeWhile((items) => !items?.[index + 1], true),
    //   take(1)
    // );

    const item = await new Promise<string | undefined>((resolve) => {
      let value: string | undefined;
      let resolved = false;

      const sub = instructions$.subscribe({
        next(v) {
          value = v[index];
          if (!!v[index + 1] && !resolved) {
            resolved = true;
            resolve(value);
          }
        },
        complete() {
          if (!resolved) {
            resolved = true;
            resolve(value);
          }
          setTimeout(() => {
            sub.unsubscribe();
          }, 0);
        },
      });
    });

    // const item = await lastValueFrom(
    //   instructions$.pipe(
    //     filter((items) => !!items?.[index]),
    //     map((items) => items?.[index]),
    //     take(1),
    //     defaultIfEmpty(undefined)
    //   )
    // );

    const MAX_NUM_TOKENS_PER_ROW = 80;
    const NUM_PLACEHOLDERS_TOKENS = 5;
    const tokens = new Array(MAX_NUM_TOKENS_PER_ROW).fill(0);

    return item ? (
      <li>
        <>{item}</>
        {/* <span className="flex flex-row gap-1 flex-wrap"> */}
        {/* {tokens.map((_, tokenIndex) => {
            return (
              <Suspense
                fallback={
                  tokenIndex < NUM_PLACEHOLDERS_TOKENS ? (
                    <Skeleton className="w-10 h-4" />
                  ) : null
                }
                key={tokenIndex}
              >
                <Token index={tokenIndex} itemIndex={index} />
              </Suspense>
            );
          })} */}
        {/* </span> */}
      </li>
    ) : null;
  };

  return (
    <>
      {items.map((_, index) => {
        return (
          <Suspense
            key={index}
            fallback={
              index < NUM_LINE_PLACEHOLDERS ? (
                <Skeleton className="w-full h-12" />
              ) : null
            }
          >
            <Item index={index} />
          </Suspense>
        );
      })}
    </>
  );
}
