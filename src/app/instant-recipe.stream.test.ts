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
      prompt: "Vegan desserts",
      tokens: ["banana", "chocolate"],
    });
  });

  it("should generate a high-protein breakfast correctly", async () => {
    await validateOutput({
      prompt: "High-protein breakfast options",
      tokens: ["eggs", "avocado"],
    });
  });

  it("should generate a quick pasta dish correctly", async () => {
    await validateOutput({
      prompt: "Quick pasta dishes",
      tokens: ["pasta", "pesto"],
    });
  });

  it("should generate a traditional Japanese dinner correctly", async () => {
    await validateOutput({
      prompt: "Traditional Japanese dishes",
      tokens: ["sushi", "sashimi"],
    });
  });

  it("should generate a healthy smoothie correctly", async () => {
    await validateOutput({
      prompt: "Healthy smoothie recipes",
      tokens: ["spinach", "mango"],
    });
  });

  it("should generate a comfort food dinner correctly", async () => {
    await validateOutput({
      prompt: "Comfort food recipes",
      tokens: ["soup", "bread"],
    });
  });

  it("should generate a festive holiday dessert correctly", async () => {
    await validateOutput({
      prompt: "Festive holiday desserts",
      tokens: ["pumpkin", "pie"],
    });
  });

  it("should generate a street food snack correctly", async () => {
    await validateOutput({
      prompt: "Street food options",
      tokens: ["tacos", "salsa"],
    });
  });

  it("should generate a gourmet seafood dish correctly", async () => {
    await validateOutput({
      prompt: "Gourmet seafood recipes",
      tokens: ["lobster", "butter"],
    });
  });
});
