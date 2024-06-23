import { Observable } from "rxjs";
import { describe, expect, it } from "vitest";
import {
  InstantRecipeEvent,
  InstantRecipeOutput,
  InstantRecipeOutputSchema,
  InstantRecipeStream,
  InstantRecipeStreamInput,
} from "./instant-recipe.stream";

describe("InstantRecipeStream", () => {
  async function processStream(
    observable: Observable<InstantRecipeEvent>
  ): Promise<InstantRecipeOutput> {
    return new Promise((resolve, reject) => {
      let completeData: InstantRecipeOutput | null = null;
      observable.subscribe({
        next: (event: InstantRecipeEvent) => {
          if (event.type === "INSTANT_RECIPE_COMPLETE") {
            completeData = event.data;
            console.log(event);
            resolve(event.data);
          }
        },
        error: (err: any) => reject(err),
      });
    });
  }

  async function validateOutput(input: InstantRecipeStreamInput) {
    const recipeStream = new InstantRecipeStream();
    const observableStream = recipeStream.getObservable(
      input
    ) as Observable<InstantRecipeEvent>;
    const outputData = await processStream(observableStream);
    console.log(outputData);
    const result = InstantRecipeOutputSchema.safeParse(outputData);
    expect(result.success).toBe(true);
  }

  it("should generate a vegan dessert correctly", async () => {
    await validateOutput({
      prompt: "vegan banana chocolate dessert",
    });
  });

  it("should generate a high-protein breakfast correctly", async () => {
    await validateOutput({
      prompt: "high-protein breakfast with eggs and avocado",
    });
  });

  it("should generate a quick pasta dish correctly", async () => {
    await validateOutput({
      prompt: "quick pasta dish with pesto",
    });
  });

  it("should generate a traditional Japanese dinner correctly", async () => {
    await validateOutput({
      prompt: "traditional Japanese dinner with sushi and sashimi",
    });
  });

  it("should generate a healthy smoothie correctly", async () => {
    await validateOutput({
      prompt: "healthy smoothie with spinach and mango",
    });
  });

  it("should generate a comfort food dinner correctly", async () => {
    await validateOutput({
      prompt: "comfort food dinner with soup and bread",
    });
  });

  it("should generate a festive holiday dessert correctly", async () => {
    await validateOutput({
      prompt: "festive holiday dessert with pumpkin pie",
    });
  });

  it("should generate a street food snack correctly", async () => {
    await validateOutput({
      prompt: "street food tacos with salsa",
    });
  });

  it("should generate a gourmet seafood dish correctly", async () => {
    await validateOutput({
      prompt: "gourmet seafood dish with lobster and butter",
    });
  });

  it("should generate a blueberry pancake recipe correctly", async () => {
    await validateOutput({
      prompt: "blueberry pancakes",
    });
  });
});