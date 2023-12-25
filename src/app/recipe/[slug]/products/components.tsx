import { Skeleton } from "@/components/display/skeleton";
import { and, eq } from "drizzle-orm";
import Image from "next/image";
import { Suspense } from "react";

import Generator from "@/components/ai/generator";
import { Card } from "@/components/display/card";
import { AmazonAffiliateProductTable, RecipeSchema, db } from "@/db";
import { Media } from "@/db/types";
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
  RecipeProductsPredictionInput,
} from "@/types";
import { PromptTemplate } from "langchain/prompts";
import { ExternalLinkIcon, SparklesIcon } from "lucide-react";
import Link from "next/link";
import {
  Observable,
  Subject,
  concatMap,
  defaultIfEmpty,
  filter,
  finalize,
  firstValueFrom,
  from,
  map,
  merge,
  mergeMap,
  reduce,
  scan,
  switchMap,
  take,
  takeUntil,
} from "rxjs";
import sharp from "sharp";
import { AmazonProductsTokenStream } from "./amazon-products-stream";
import { RecipeProductsTokenStream } from "./recipe-products-stream";
import { GoogleCustomSearchResponseSchema } from "./schema";

export const ProductsCarousel = ({
  input$,
  slug,
}: {
  input$: Observable<RecipeProductsPredictionInput>;
  slug: string;
}) => {
  const itemCount = 10;

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
        filter((array) => {
          // Check if the array is defined and if the value at the targetIndex is not undefined
          return array && array.length > index && array[index] !== undefined;
        }),
        takeUntil(
          merge(
            products$.pipe(
              filter((array) => {
                // Check if products$ completes without any non-undefined values at the target index
                return (
                  array && array.length > index && array[index] === undefined
                );
              }),
              take(1)
            )
          )
        ),
        map((array) => array[index]),
        defaultIfEmpty(undefined) // Extract the value at the target index
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
                  mergeMap(async (product) => {
                    let imageUrl = getAmazonImageUrl(product.asin);
                    let buffer: Buffer;

                    try {
                      const pageResponse = await fetch(
                        getAffiliatelink(product.asin),
                        {
                          redirect: "follow",
                        }
                      );

                      if (!pageResponse.ok) {
                        return undefined;
                      }
                    } catch (ex) {
                      return undefined;
                    }

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
                          description: "",
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
                  ),
                  finalize(() => {
                    newProduct$.complete();
                  })
                )
                .subscribe(() => {
                  // console.log("added");
                });
            });
        }}
      />
    );
  };

  const items = new Array(itemCount).fill(0);

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

const finalRecipeSchema = RecipeSchema.pick({
  name: true,
  description: true,
  yield: true,
  slug: true,
  tags: true,
  ingredients: true,
  instructions: true,
});

export const MediaCarousel = ({ media }: { media: Media[] }) => {
  const itemCount = 4;

  // const getGeneratedMedia = async () => {
  //   const recipe = await firstValueFrom(recipe$);
  //   const replicate = new Replicate();

  //   const prompt = await mediaPromptTemplate.format({
  //     name: recipe.name,
  //     yield: recipe.yield,
  //     description: recipe.description,
  //     tags: Array.isArray(recipe.tags) ? recipe.tags.join("\n") : "",
  //     ingredients: Array.isArray(recipe.ingredients)
  //       ? recipe.ingredients.join("\n")
  //       : "",
  //     instructions: Array.isArray(recipe.instructions)
  //       ? recipe.instructions.join("\n")
  //       : "",
  //   });
  //   console.log("genearting");

  //   const output = await replicate.run(
  //     "stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b",
  //     {
  //       input: {
  //         width: 768,
  //         height: 768,
  //         prompt,
  //         refine: "expert_ensemble_refiner",
  //         scheduler: "K_EULER",
  //         lora_scale: 0.6,
  //         num_outputs: 4,
  //         guidance_scale: 7.5,
  //         apply_watermark: false,
  //         high_noise_frac: 0.8,
  //         negative_prompt: "",
  //         prompt_strength: 0.8,
  //         num_inference_steps: 25,
  //       },
  //     }
  //   );
  //   console.log(output);

  //   assert(Array.isArray(output), "expected array output");

  //   const promises = output.map(async (imageUrl: string) => {
  //     const imgResponse = await fetch(imageUrl);
  //     if (!imgResponse.ok) {
  //       throw new Error(
  //         `Failed to fetch ${imageUrl}: ${imgResponse.statusText}`
  //       );
  //     }
  //     const blobData = await imgResponse.blob();
  //     const buffer = Buffer.from(await blobData.arrayBuffer());

  //     let processedImage: Buffer;
  //     try {
  //       processedImage = await sharp(buffer)
  //         .resize(10, 10) // Resize to a very small image
  //         .blur() // Optional: add a blur effect
  //         .toBuffer();
  //     } catch (ex) {
  //       console.error(ex);
  //       throw ex;
  //     }
  //     const base64Image = processedImage.toString("base64");

  //     const mediaId = randomUUID();
  //     const media = {
  //       id: mediaId,
  //       mediaType: "IMAGE",
  //       contentType: "image/png",
  //       sourceType: "GENERATED",
  //       height: 768,
  //       url: imageUrl,
  //       width: 768,
  //       blurDataURL: base64Image,
  //       filename: "generated-1.png",
  //       createdBy: null,
  //       createdAt: new Date(),
  //       duration: null,
  //     } satisfies Media;

  //     (async () => {
  //       try {
  //         console.log("Inserting ", media);
  //         await db.insert(MediaTable).values(media);
  //         console.log("inserting assocation");
  //         await db.insert(GeneratedMediaTable).values({
  //           recipeSlug: recipe.slug,
  //           mediaId,
  //         });
  //       } catch (ex) {
  //         console.error(ex);
  //       }
  //     })();

  //     return media;
  //   });
  //   const results = await Promise.all(promises);
  //   return results;
  // };

  // const media$ = from(recipe$).pipe(
  //   first(),
  //   tap(console.log),
  //   switchMap(async (recipe) => {
  //     const mediaList = await getGeneratedMediaForRecipeSlug(db, recipe.slug);
  //     console.log(mediaList);

  //     if (mediaList.length > 0) {
  //       return mediaList;
  //     } else {
  //       return await getGeneratedMedia();
  //     }
  //   })
  // );

  const MediaItem = ({ index }: { index: number }) => {
    // const media = await firstValueFrom(
    //   media$.pipe(
    //     filter((array) => {
    //       // Check if the array is defined and if the value at the targetIndex is not undefined
    //       return array && array.length > index && array[index] !== undefined;
    //     }),
    //     takeUntil(
    //       merge(
    //         media$.pipe(
    //           filter((array) => {
    //             // Check if products$ completes without any non-undefined values at the target index
    //             return (
    //               array && array.length > index && array[index] === undefined
    //             );
    //           }),
    //           take(1)
    //         )
    //       )
    //     ),
    //     map((array) => array[index]),
    //     defaultIfEmpty(undefined) // Extract the value at the target index
    //   )
    // );
    // if (!media) {
    //   return <></>;
    // }
    const item = media[index];
    if (!item) {
      return <></>;
    }

    return (
      <div className="w-80 h-80 bg-white shadow-lg rounded-lg overflow-hidden flex flex-col">
        <div className="relative">
          <Image
            className="w-auto h-auto object-contain"
            src={item.url}
            alt={`Generated Image #${index + 1}`}
            width={item.width}
            height={item.height}
          />
        </div>
      </div>
    );
  };

  const items = new Array(itemCount).fill(0);

  return (
    <div className="h-96 carousel carousel-center overflow-y-hidden space-x-2 flex-1 pl-1 pr-4 sm:p-0 md:justify-center">
      {items.map((_, index) => (
        <div key={index} className="carousel-item">
          <MediaItem index={index} />
        </div>
      ))}
    </div>
  );
};

export const MediaCarouselFallback = () => {
  const itemCount = 4;

  const MediaItem = ({ index }: { index: number }) => {
    return (
      <div className="w-80 h-80 bg-white shadow-lg rounded-lg overflow-hidden flex flex-col">
        <div className="relative flex flex-col justify-center items-center gap-8 h-full">
          <h5 className="animate-pulse flex flex-row gap-2">
            <span>Genearting Image #{index + 1}</span> <SparklesIcon />
          </h5>
          <span className="text-xs text-foreground-muted animate-ping">
            Check back soon
          </span>
        </div>
      </div>
    );
  };

  const items = new Array(itemCount).fill(0);

  return (
    <div className="h-96 carousel carousel-center overflow-y-hidden space-x-2 flex-1 pl-1 pr-4 sm:p-0 md:justify-center">
      {items.map((_, index) => (
        <div key={index} className="carousel-item">
          <MediaItem index={index} />
        </div>
      ))}
    </div>
  );
};

const mediaPromptTemplate = PromptTemplate.fromTemplate(`
An realistic photo of the final output of the following recipe:

{name}
{description}
{yield}
{tags}

ingredients: {ingredients}

instructions: {instructions}
`);
