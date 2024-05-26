import { describe, expect, it } from "vitest";
import {
  ListNameSuggestionOutputSchema,
  ListNameSuggestionStream,
} from "./list-name-suggestion.stream";

describe("ListNameSuggestionTokensStream", () => {
  async function processStream(stream: AsyncIterable<string>) {
    const charArray = [];
    for await (const chunk of stream) {
      charArray.push(chunk);
    }
    return charArray.join("");
  }

  async function validateOutput(input: {
    prompt: string;
    recipeNames: string[];
  }) {
    const tokenStream = new ListNameSuggestionStream();
    const stream = await tokenStream.getStream(input);
    const outputRaw = await processStream(stream);
    console.log(outputRaw)
    const result = ListNameSuggestionOutputSchema.safeParse(outputRaw);

    expect(result.success).toBe(true);
  }

  it("should suggest a creative list name for a combination of grains and greens", async () => {
    await validateOutput({
      prompt: "Quinoa, Kale",
      recipeNames: ["Quinoa Kale Salad with Avocado"],
    });
  });

  it("should suggest a creative list name for summer fruits", async () => {
    await validateOutput({
      prompt: "Mango, Berries",
      recipeNames: ["Tropical Mango Smoothie", "Mixed Berry Tart"],
    });
  });

  it("should suggest a creative list name for festive ingredients", async () => {
    await validateOutput({
      prompt: "Pumpkin, Cinnamon",
      recipeNames: ["Classic Pumpkin Pie", "Homemade Cinnamon Rolls"],
    });
  });

  it("should suggest a creative list name for popular snack ingredients", async () => {
    await validateOutput({
      prompt: "Kale, Nuts",
      recipeNames: ["Crispy Kale Chips", "Spicy Roasted Nuts"],
    });
  });

  it("should suggest a creative list name for a mix of international flavors", async () => {
    await validateOutput({
      prompt: "Rice, Beans, Spices",
      recipeNames: ["Mexican Rice and Beans", "Spicy Indian Curry"],
    });
  });

  it("should suggest a creative list name for classic comfort ingredients", async () => {
    await validateOutput({
      prompt: "Cheese, Potatoes",
      recipeNames: ["Rich Cheese Fondue", "Creamy Potato Gratin"],
    });
  });
});
