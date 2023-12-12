import { Skeleton } from "@/components/display/skeleton";
import { and, eq } from "drizzle-orm";
import { Suspense } from "react";

import Generator from "@/components/ai/generator";
import { Card } from "@/components/display/card";
import { AmazonAffiliateProductTable, db } from "@/db";
import { privateEnv } from "@/env.secrets";
import { getAffiliatelink, getAmazonImageUrl } from "@/lib/amazon";
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
  ProductType,
  RecipeProductsPredictionInput,
} from "@/types";
import Link from "next/link";
import {
  Observable,
  Subject,
  concatMap,
  defaultIfEmpty,
  filter,
  firstValueFrom,
  from,
  map,
  mergeMap,
  reduce,
  scan,
  switchMap,
  take,
  tap,
} from "rxjs";
import sharp from "sharp";
import { AmazonProductsTokenStream } from "./amazon-products-stream";
import { RecipeProductsTokenStream } from "./recipe-products-stream";
import { GoogleCustomSearchResponseSchema } from "./schema";
import { ExternalLinkIcon } from "lucide-react";

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

    return (
      <Link href={getAffiliatelink(product.asin)} target="_blank">
        <Card className="w-48 h-80 bg-white shadow-lg rounded-lg overflow-hidden flex flex-col">
          <div className="relative">
            <img
              className="w-full h-56 object-contain p-4"
              src={product.imageUrl}
              alt={product.name}
            />
          </div>
          <div className="p-4 bg-slate-50 text-slate-900 flex-1 flex items-center justify-center text-sm">
            <h4 className="font-semibold text-md mb-2 line-clamp-3 flex-1">
              {product.name}{" "}
              <ExternalLinkIcon className="inline mb-1" size={14} />
            </h4>
          </div>
        </Card>
      </Link>
    );
  };

  const ProductsGenerator = async () => {
    const type = await firstValueFrom(input$.pipe(map((input) => input.type)));

    const products = await db
      .select()
      .from(AmazonAffiliateProductTable)
      .where(
        and(
          eq(AmazonAffiliateProductTable.recipeSlug, slug),
          eq(AmazonAffiliateProductTable.type, type)
        )
      );

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

    const getGoogleResultsForAffiliateProducts = async (keyword: string) => {
      let query: string;
      switch (type) {
        case "book":
          query = `book ${keyword}`;
          break;
        case "equipment":
          query = `kitchen ${keyword}`;
          break;
        default:
          query = keyword;
      }

      const googleSearchResponse = await fetch(
        `https://www.googleapis.com/customsearch/v1?key=${
          privateEnv.GOOGLE_CUSTOM_SEARCH_API_KEY
        }&cx=${
          privateEnv.GOOGLE_CUSTOM_SEARCH_ENGINE_ID
        }&q=${encodeURIComponent(query)}`
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
          from(output.queries)
            .pipe(
              concatMap((query) =>
                getGoogleResultsForAffiliateProducts(query)
                  .then((googleSearchJSON) => ({
                    googleSearchJSON,
                    query,
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
                const filteredItems = items
                  .map((item) => {
                    const parseASIN = AmazonProductPageUrlSchema.safeParse(
                      item.link
                    );
                    if (!parseASIN.success || !parseASIN.data) {
                      return undefined;
                    }
                    const asin = parseASIN.data;
                    return {
                      asin,
                      name: item.title,
                    };
                  })
                  .filter(notUndefined);
                const googleSearchText = JSON.stringify(filteredItems);
                const tokenStream = new AmazonProductsTokenStream();

                const stream = await tokenStream.getStream({
                  type,
                  googleSearchText,
                  recipe,
                });
                const charArray: string[] = [];
                // console.log("starting stream for", type);
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
                  type,
                }));
              }),
              take(1)
            )

            .subscribe((result) => {
              from(result)
                .pipe(
                  // tap((product) => console.log("processing", product.name)),
                  concatMap(async (product) => {
                    let imageUrl = getAmazonImageUrl(product.asin);
                    let buffer: Buffer;
                    try {
                      const imgResponse = await fetch(imageUrl, {
                        redirect: "follow",
                      });
                      if (!imgResponse.ok) {
                        // only use products with working images
                        return undefined;
                      }
                      imageUrl = imgResponse.url; // grab the redirected url
                      const blobData = await imgResponse.blob();
                      buffer = Buffer.from(await blobData.arrayBuffer());

                      if (!buffer.length) {
                        return undefined;
                      }
                    } catch (ex) {
                      return undefined;
                    }

                    let processedImage: Buffer;
                    try {
                      processedImage = await sharp(buffer)
                        .resize(10, 10) // Resize to a very small image
                        .blur() // Optional: add a blur effect
                        .toBuffer();
                    } catch (ex) {
                      return undefined;
                    }
                    const blurDataUrl = processedImage.toString("base64");

                    const imageWidth = 20;
                    const imageHeight = 20;

                    return {
                      product,
                      blurDataUrl,
                      imageUrl,
                      imageWidth,
                      imageHeight,
                    };
                  }),
                  filter(notUndefined),
                  mergeMap(
                    async ({
                      product,
                      blurDataUrl,
                      imageUrl,
                      imageWidth,
                      imageHeight,
                    }) => {
                      try {
                        const newProduct = {
                          name: product.name,
                          asin: product.asin,
                          type: type,
                          imageUrl: imageUrl,
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
                        // this is okay, but should be pretty rare
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

  const items = new Array(10).fill(0);

  return (
    <div className="h-96 carousel carousel-center overflow-y-hidden space-x-2 flex-1 pl-1 pr-4 sm:p-0 md:justify-center">
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
