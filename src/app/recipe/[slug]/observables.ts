import { getRecipe } from "@/db/queries";
import { TokenParser } from "@/lib/token-parser";
import { RecipePredictionOutputSchema } from "@/schema";
import { PromptTemplate } from "langchain/prompts";
import { cache } from "react";
import { Observable, ReplaySubject, filter, map, of, takeWhile } from "rxjs";
import { Recipe } from "../../../db/types";
import { getBaseRecipe } from "./queries";
import { RecipeTokenStream } from "./stream";
import { RecipeData } from "./types";

export const getObservables = (recipe$: Observable<Partial<Recipe>>) => ({
  name$: recipe$.pipe(
    takeWhile((item: Partial<Recipe>) => item.description === undefined, true), // Keep emitting until ingredients is not undefined
    filter(
      (item: Partial<Recipe>): item is Partial<Recipe> & { name: string } =>
        item.name !== undefined
    ),
    map((item) => item.name)
  ),
  description$: recipe$.pipe(
    takeWhile((item: Partial<Recipe>) => item.tags === undefined, true), // Keep emitting until ingredients is not undefined
    filter(
      (
        item: Partial<Recipe>
      ): item is Partial<Recipe> & { description: string } =>
        item.description !== undefined
    ),
    map((item) => item.description)
  ),
  ingredients$: recipe$.pipe(
    takeWhile((item: Partial<Recipe>) => item.instructions === undefined, true), // Keep emitting until ingredients is not undefined
    filter(
      (
        item: Partial<Recipe>
      ): item is Partial<Recipe> & { ingredients: string[] } =>
        item.ingredients !== undefined && Array.isArray(item.ingredients)
    ),
    map((item) => item.ingredients)
  ),
  instructions$: recipe$.pipe(
    filter(
      (
        item: Partial<Recipe>
      ): item is Partial<Recipe> & { instructions: string[] } =>
        item.instructions !== undefined && Array.isArray(item.instructions)
    ),
    map((item) => item.instructions)
  ),
  yield$: recipe$.pipe(
    takeWhile((item: Partial<Recipe>) => item.tags === undefined, true), // Keep emitting until ingredients is not undefined
    filter(
      (item: Partial<Recipe>): item is Partial<Recipe> & { yield: string } =>
        item.yield !== undefined
    ),
    map((item) => item.yield)
  ),
  tags$: recipe$.pipe(
    takeWhile((item: Partial<Recipe>) => item.ingredients === undefined, true), // Keep emitting until ingredients is not undefined
    filter(
      (item: Partial<Recipe>): item is Partial<Recipe> & { tags: string[] } =>
        item.tags !== undefined && Array.isArray(item.tags)
    ),
    map((item) => item.tags)
  ),
  activeTime$: recipe$.pipe(
    takeWhile((item: Partial<Recipe>) => item.tags === undefined, true), // Keep emitting until ingredients is not undefined
    filter(
      (
        item: Partial<Recipe>
      ): item is Partial<Recipe> & { activeTime: string } =>
        item.activeTime !== undefined
    ),
    map((item) => item.activeTime)
  ),
  cookTime$: recipe$.pipe(
    takeWhile((item: Partial<Recipe>) => item.tags === undefined, true), // Keep emitting until ingredients is not undefined
    filter(
      (item: Partial<Recipe>): item is Partial<Recipe> & { cookTime: string } =>
        item.cookTime !== undefined
    ),
    map((item) => item.cookTime)
  ),
  totalTime$: recipe$.pipe(
    takeWhile((item: Partial<Recipe>) => item.tags === undefined, true), // Keep emitting until ingredients is not undefined
    filter(
      (
        item: Partial<Recipe>
      ): item is Partial<Recipe> & { totalTime: string } =>
        item.totalTime !== undefined
    ),
    map((item) => item.totalTime)
  ),
});

// export const getGeneratedMedia$ = async (slug: string) => {
//   const recipeData$ = await getRecipeData$(slug);
//   const obs = recipeData$.pipe(
//     switchMap(async (recipe) => {
//       const existingMedia = await getGeneratedMediaForRecipeSlug(
//         db,
//         recipe.slug
//       );

//       if (existingMedia.length) {
//         return existingMedia;
//       }

//       const replicate = new Replicate();

//       const prompt = await mediaPromptTemplate.format({
//         name: recipe.name,
//         yield: recipe.yield,
//         description: recipe.description,
//         tags: Array.isArray(recipe.tags) ? recipe.tags.join("\n") : "",
//         ingredients: Array.isArray(recipe.ingredients)
//           ? recipe.ingredients.join("\n")
//           : "",
//         instructions: Array.isArray(recipe.instructions)
//           ? recipe.instructions.join("\n")
//           : "",
//       });
//       const output = await replicate.run(
//         "stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b",

/**
 * Gets the stream as an rxjs observable for a recipe being created.
 * @param slug
 * @returns
 */
export const getRecipeStream$ = cache(async (slug: string) => {
  const [recipe, baseRecipe] = await Promise.all([
    getRecipe(slug),
    getBaseRecipe(slug),
  ]);

  // If the recipe exists already, just return it wrapped an observable
  if (recipe) {
    return of(recipe);
  } else {
    // Otherwise get the scream that we assume is ongoing
    // and parse its output as we get it, and send it to a
    // replay subject that can be listened to.
    const subject = new ReplaySubject<Partial<RecipeData>>(1);

    (async () => {
      try {
        const parser = new TokenParser(RecipePredictionOutputSchema);
        if (baseRecipe.outputRaw) {
          let output = parser.parsePartial(baseRecipe.outputRaw);
          if (output?.recipe) {
            subject.next(output.recipe);
          }
        }

        const tokenStream = new RecipeTokenStream({
          cacheKey: `recipe:${slug}`,
        });
        const stream = await tokenStream.getStream();

        const charArray = [];
        for await (const chunk of stream) {
          if (chunk) {
            for (const char of chunk) {
              charArray.push(char);
            }
          }

          const outputRaw = charArray.join("");
          const output = parser.parsePartial(outputRaw);
          if (output?.recipe) {
            subject.next(output.recipe);
          }
        }

        const outputRaw = charArray.join("");

        let recipe;
        try {
          recipe = parser.parse(outputRaw).recipe;
          subject.next(recipe);
        } catch (ex) {
          subject.error(ex);
        }
        subject.complete();
      } catch (ex) {
        subject.error(ex);
      }
    })();
    return subject as Observable<RecipeData>;
  }
});
//         {
//           input: {
//             width: 768,
//             height: 768,
//             prompt,
//             refine: "expert_ensemble_refiner",
//             scheduler: "K_EULER",
//             lora_scale: 0.6,
//             num_outputs: 4,
//             guidance_scale: 7.5,
//             apply_watermark: false,
//             high_noise_frac: 0.8,
//             negative_prompt: "",
//             prompt_strength: 0.8,
//             num_inference_steps: 25,
//           },
//         }
//       );
//       assert(Array.isArray(output), "expected array output");
//       const promises = output.map(async (imageUrl: string) => {
//         const imgResponse = await fetch(imageUrl);
//         if (!imgResponse.ok) {
//           throw new Error(
//             `Failed to fetch ${imageUrl}: ${imgResponse.statusText}`
//           );
//         }
//         const blobData = await imgResponse.blob();
//         const buffer = Buffer.from(await blobData.arrayBuffer());

//         let processedImage: Buffer;
//         try {
//           processedImage = await sharp(buffer)
//             .resize(10, 10) // Resize to a very small image
//             .blur() // Optional: add a blur effect
//             .toBuffer();
//         } catch (ex) {
//           console.error(ex);
//           throw ex;
//         }
//         const base64Image = processedImage.toString("base64");

//         const mediaId = randomUUID();
//         const media = {
//           id: mediaId,
//           mediaType: "IMAGE",
//           contentType: "image/png",
//           sourceType: "GENERATED",
//           height: 768,
//           url: imageUrl,
//           width: 768,
//           blurDataURL: base64Image,
//           filename: "generated-1.png",
//           createdBy: null,
//           createdAt: new Date(),
//           duration: null,
//         } satisfies Media;

//         (async () => {
//           try {
//             await db.insert(MediaTable).values(media);
//             await db.insert(GeneratedMediaTable).values({
//               recipeSlug: recipe.slug,
//               mediaId,
//             });
//           } catch (ex) {
//             console.error(ex);
//           }
//         })();

//         return media;
//       });
//       return await Promise.all(promises);
//     }),
//     shareReplay(1)
//   );
//   return obs;
// };

const mediaPromptTemplate = PromptTemplate.fromTemplate(`
A clear photo to feature on a blog for the following recipe:

{name}
{description}
{yield}
{tags}

ingredients: {ingredients}

instructions: {instructions}
`);
