import { assert } from "@/lib/utils";
import { Observable } from "rxjs";
import { describe, expect, it } from "vitest";
import {
  RecipeIdeasMetadataEvent,
  RecipeIdeasMetadataOutput,
  RecipeIdeasMetadataOutputSchema,
  RecipeIdeasMetadataStream,
  RecipeIdeasMetadataStreamInput,
} from "./recipe-ideas-metadata.stream";

describe("RecipeIdeasMetadataStream", () => {
  async function processStream(
    observable: Observable<RecipeIdeasMetadataEvent>
  ): Promise<RecipeIdeasMetadataOutput> {
    return new Promise((resolve, reject) => {
      let completeData: RecipeIdeasMetadataOutput | null = null;
      observable.subscribe({
        next: (event: RecipeIdeasMetadataEvent) => {
          if (event.type === "RECIPE_IDEAS_METADATA_COMPLETE") {
            completeData = event.data;
            resolve(event.data);
          }
        },
        error: (err: any) => reject(err),
      });
    });
  }

  async function validateOutput(input: RecipeIdeasMetadataStreamInput) {
    const recipeStream = new RecipeIdeasMetadataStream();
    const observableStream = recipeStream.getObservable(
      input
    ) as Observable<RecipeIdeasMetadataEvent>;
    const outputData = await processStream(observableStream);

    const result = RecipeIdeasMetadataOutputSchema.safeParse(outputData);
    assert(result.success, "expected result to be success");
    // Uncomment the lines below if you want to check the number of ideas and their properties
    expect(result.data.ideas.length).toBe(5); // Check if five recipe ideas are generated
    result.data.ideas.forEach((recipe) => {
      expect(recipe.name).toBeDefined();
      expect(recipe.description).toBeDefined();
    });
  }

  it("should generate related recipe ideas for a salad prompt", async () => {
    await validateOutput({
      prompt: "Fresh and healthy salads",
      tokens: ["lettuce", "tomato"],
      instantRecipe: {
        name: "Caesar Salad",
        description:
          "A classic Caesar salad with romaine lettuce, parmesan cheese, and croutons",
        ingredients: ["romaine lettuce", "parmesan cheese", "croutons"],
      },
    });
  });

  it("should generate related recipe ideas for a dessert prompt", async () => {
    await validateOutput({
      prompt: "Quick and easy desserts",
      tokens: ["chocolate", "vanilla"],
      instantRecipe: {
        name: "Chocolate Mousse",
        description:
          "Rich and creamy chocolate mousse topped with whipped cream",
        ingredients: ["dark chocolate", "heavy cream", "sugar"],
      },
    });
  });

  it("should generate related recipe ideas for a breakfast prompt", async () => {
    await validateOutput({
      prompt: "Hearty breakfast options",
      tokens: ["eggs", "bacon"],
      instantRecipe: {
        name: "Bacon and Eggs",
        description: "Crispy bacon served with fried eggs",
        ingredients: ["bacon", "eggs"],
      },
    });
  });

  it("should generate related recipe ideas for a vegan meal prompt", async () => {
    await validateOutput({
      prompt: "Vegan dinner ideas",
      tokens: ["tofu", "spinach"],
      instantRecipe: {
        name: "Vegan Stir Fry",
        description:
          "A delicious stir fry with tofu, spinach, and a variety of vegetables",
        ingredients: ["tofu", "spinach", "bell peppers", "soy sauce"],
      },
    });
  });

  it("should generate related recipe ideas for a seafood prompt", async () => {
    await validateOutput({
      prompt: "Luxurious seafood dishes",
      tokens: ["salmon", "shrimp"],
      instantRecipe: {
        name: "Grilled Salmon",
        description: "Perfectly grilled salmon with a lemon butter sauce",
        ingredients: ["salmon", "lemon", "butter"],
      },
    });
  });
});
