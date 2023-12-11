import { Skeleton } from "@/components/display/skeleton";
import { formatDuration, sentenceToSlug } from "@/lib/utils";
import { eq } from "drizzle-orm";
import { ClockIcon, TagIcon } from "lucide-react";
import { Suspense } from "react";

import Generator from "@/components/ai/generator";
import { Badge } from "@/components/display/badge";
import { Card } from "@/components/display/card";
import { Label } from "@/components/display/label";
import { RenderFirstValue } from "@/components/util/render-first-value";
import { AmazonAffiliateProductTable, db } from "@/db";
import { getProfileByUserId, getUserLifetimePoints } from "@/db/queries";
import { privateEnv } from "@/env.secrets";
import { getAffiliatelink } from "@/lib/amazon";
import { getObservableAtIndex, getTokenObservableAtIndex } from "@/lib/rxjs";
import { TokenParser } from "@/lib/token-parser";
import { notUndefined } from "@/lib/type-guards";
import {
  AmazonProductPageUrlSchema,
  AmazonProductsPredictionOutputSchema,
  RecipeProductsPredictionOutputSchema,
} from "@/schema";
import {
  AmazonAffiliateProduct,
  GoogleCustomSearchResponse,
  RecipeProductsPredictionInput,
} from "@/types";
import { ChefHatIcon } from "lucide-react";
import Link from "next/link";
import {
  Observable,
  Subject,
  concatMap,
  defaultIfEmpty,
  filter,
  firstValueFrom,
  from,
  lastValueFrom,
  map,
  mergeMap,
  reduce,
  scan,
  shareReplay,
  switchMap,
  take,
} from "rxjs";
import sharp from "sharp";
import { AmazonProductsTokenStream } from "./products/amazon-products-stream";
import { RecipeProductsTokenStream } from "./products/recipe-products-stream";
import { GoogleCustomSearchResponseSchema } from "./products/schema";

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

      <Link href="/@inspectorT" className="flex flex-row gap-1 items-center">
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
                          return <>@{profile.profileSlug}</>;
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
      </Link>
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

export const ProductsCarousel = ({
  input$,
  slug,
}: {
  input$: Observable<RecipeProductsPredictionInput>;
  slug: string;
}) => {
  const newProduct$ = new Subject<AmazonAffiliateProduct>();
  const products$ = newProduct$.pipe(
    scan(
      (acc: AmazonAffiliateProduct[], event: AmazonAffiliateProduct) => [
        ...acc,
        event,
      ],
      [] as AmazonAffiliateProduct[]
    )
  );
  const Product = async ({ index }: { index: number }) => {
    const product = await firstValueFrom(
      products$.pipe(
        filter((products) => !!products[index]),
        map((products) => products[index]),
        take(1),
        defaultIfEmpty(undefined)
      )
    );
    if (!product) {
      return <></>;
    }

    const link = getAffiliatelink(product.asin);

    return (
      <Link href={getAffiliatelink(product.asin)} target="_blank">
        <Card className="w-48 h-80 bg-white shadow-lg rounded-lg overflow-hidden flex flex-col">
          <img
            className="w-full h-56 object-contain p-4"
            src={product.imageUrl}
            alt={product.name}
          />
          <div className="p-4 bg-slate-50 text-slate-900 flex-1 flex items-center justify-center text-sm">
            <h4 className="font-semibold text-md mb-2 line-clamp-3">
              {product.name}
            </h4>
          </div>
        </Card>
      </Link>
    );
  };

  const ProductsGenerator = async () => {
    const products = await db
      .select()
      .from(AmazonAffiliateProductTable)
      .where(eq(AmazonAffiliateProductTable.recipeSlug, slug));
    if (products.length) {
      for (const product of products) {
        newProduct$.next(product);
      }
      newProduct$.complete();
      return null;
    }

    const tokenStream = new RecipeProductsTokenStream();
    const input = await firstValueFrom(input$);
    const recipe = input.recipe;
    const stream = await tokenStream.getStream(input);

    const getGoogleResultsForAffiliateProducts = async (product: {
      name: string;
      description: string;
    }) => {
      const googleSearchResponse = await fetch(
        `https://www.googleapis.com/customsearch/v1?key=${
          privateEnv.GOOGLE_CUSTOM_SEARCH_API_KEY
        }&cx=${
          privateEnv.GOOGLE_CUSTOM_SEARCH_ENGINE_ID
        }&q=${encodeURIComponent(product.name)}`
      );

      const result = await googleSearchResponse.json();
      return result;
    };

    return (
      <Generator
        stream={stream}
        schema={RecipeProductsPredictionOutputSchema}
        onError={(error, outputRaw) => {
          console.error(error, outputRaw);
        }}
        onComplete={(output) => {
          from(output.products)
            .pipe(
              concatMap((product) =>
                getGoogleResultsForAffiliateProducts(product)
                  .then((googleSearchJSON) => ({
                    googleSearchJSON,
                    product,
                  }))
                  .catch((error) => {
                    console.error(
                      "Error in getGoogleResultsForAffiliateProducts:",
                      error
                    );
                    return undefined; // Return null or some sentinel value to indicate an error
                  })
              ),
              filter(notUndefined),
              map(({ googleSearchJSON }) => {
                const parseResult =
                  GoogleCustomSearchResponseSchema.safeParse(googleSearchJSON);
                if (!parseResult.success) {
                  console.log(parseResult.error);
                  return undefined;
                }

                return parseResult.data.items;
              }),
              filter(notUndefined),
              reduce(
                (acc: GoogleCustomSearchResponse["items"], items) => {
                  // Ensure that 'acc' is not undefined
                  if (!acc) {
                    acc = [];
                  }

                  return acc.concat(items);
                },
                [] as GoogleCustomSearchResponse["items"]
              ),
              filter(notUndefined),
              switchMap(async (items) => {
                const imagesUrlByASIN = new Map<string, string>();

                const filteredItems = items
                  .map((item) => {
                    const parseASIN = AmazonProductPageUrlSchema.safeParse(
                      item.link
                    );
                    if (!parseASIN.success || !parseASIN.data) {
                      return undefined;
                    }
                    const asin = parseASIN.data;

                    const imageUrl = item.pagemap?.scraped?.["0"]?.image_link;
                    if (!imageUrl) {
                      return undefined;
                    }

                    imagesUrlByASIN.set(asin, imageUrl);

                    return {
                      asin,
                      name: item.title,
                      description: item.snippet,
                    };
                  })
                  .filter(notUndefined);
                const googleSearchText = JSON.stringify(filteredItems);
                const tokenStream = new AmazonProductsTokenStream();

                const stream = await tokenStream.getStream({
                  googleSearchText,
                  recipe,
                });
                const charArray: string[] = [];
                for await (const chunk of stream) {
                  for (const char of chunk) {
                    charArray.push(char);
                  }
                }
                const outputRaw = charArray.join("");
                const parser = new TokenParser(
                  AmazonProductsPredictionOutputSchema
                );
                const result = parser.parse(outputRaw);
                return result.products.map((product) => ({
                  ...product,
                  imageUrl: imagesUrlByASIN.get(product.asin)!,
                }));
              }),
              take(1)
            )

            .subscribe((result) => {
              from(result)
                .pipe(
                  mergeMap(async (product) => {
                    const imgResponse = await fetch(product.imageUrl);
                    if (!imgResponse.ok) {
                      console.log("Bad image");
                      // only use products with working images
                      return undefined;
                    }
                    const blobData = await imgResponse.blob();
                    const buffer = Buffer.from(await blobData.arrayBuffer());

                    let processedImage: Buffer;
                    try {
                      processedImage = await sharp(buffer)
                        .resize(10, 10) // Resize to a very small image
                        .blur() // Optional: add a blur effect
                        .toBuffer();
                    } catch (ex) {
                      console.error(ex);
                      throw ex;
                    }
                    const blurDataUrl = processedImage.toString("base64");

                    const imageWidth = 20;
                    const imageHeight = 20;

                    return {
                      product,
                      blurDataUrl,
                      imageWidth,
                      imageHeight,
                    };
                  }),
                  filter(notUndefined),
                  switchMap(
                    async ({
                      product,
                      blurDataUrl,
                      imageWidth,
                      imageHeight,
                    }) => {
                      try {
                        const newProduct = {
                          name: product.name,
                          description: product.description,
                          asin: product.asin,
                          type: product.type,
                          imageUrl: product.imageUrl,
                          blurDataUrl,
                          imageHeight,
                          imageWidth,
                          recipeSlug: slug,
                          createdAt: new Date(),
                        };

                        await db
                          .insert(AmazonAffiliateProductTable)
                          .values(newProduct);
                        newProduct$.next(newProduct);
                      } catch (ex) {
                        console.error(ex);
                      }
                    }
                  )
                )
                .subscribe(() => {
                  newProduct$.complete();
                });
            });
        }}
      />
    );
  };

  const items = new Array(5).fill(0);

  return (
    <div className="h-96 carousel carousel-center overflow-y-hidden space-x-2 flex-1 pl-4 pr-4 sm:p-0 md:justify-center">
      <Suspense fallback={null}>
        <ProductsGenerator />
      </Suspense>
      {items.map((_, index) => (
        <div key={index} className="carousel-item">
          <Suspense fallback={<Skeleton className="w-48 h-80" />}>
            <Product index={index} />
          </Suspense>
        </div>
      ))}
    </div>
  );
};
