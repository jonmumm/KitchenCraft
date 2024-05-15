import { sanitizeOutput } from "@/lib/sanitize";
import { RecipeIdeasMetadataPredictionOutputSchema } from "@/schema";
import jsYaml from "js-yaml";
import { describe, expect, it } from "vitest";
import {
  RecipeIdeasMetadataStream,
  RecipeIdeasMetadataStreamInput,
} from "./recipe-ideas-metadata.stream";

describe("RecipeIdeasMetadataStream", () => {
  async function processStream(stream: AsyncIterable<string>) {
    const charArray = [];
    for await (const chunk of stream) {
      charArray.push(chunk);
    }
    return charArray.join("");
  }

  async function validateOutput(input: RecipeIdeasMetadataStreamInput) {
    const tokenStream = new RecipeIdeasMetadataStream();
    const stream = await tokenStream.getStream(input);
    const outputRaw = await processStream(stream);
    const outputSanitized = sanitizeOutput(outputRaw);
    const outputJSON = jsYaml.load(outputSanitized);

    const result =
      RecipeIdeasMetadataPredictionOutputSchema.safeParse(outputJSON);
    expect(result.success).toBe(true);
    // expect(result.data.recipes.length).toBe(5); // Check if five recipe ideas are generated
    // result.data.recipes.forEach(recipe => {
    //   expect(recipe.name).toBeDefined();
    //   expect(recipe.description).toBeDefined();
    // });
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
