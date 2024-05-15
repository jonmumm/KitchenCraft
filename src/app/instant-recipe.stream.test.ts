import { sanitizeOutput } from "@/lib/sanitize";
import { InstantRecipePredictionOutputSchema } from "@/schema";
import jsYaml from "js-yaml";
import { describe, expect, it } from "vitest";
import {
  InstantRecipeStream,
  InstantRecipeStreamInput,
} from "./instant-recipe.stream";

describe("InstantRecipeStream", () => {
  async function processStream(stream: AsyncIterable<string>) {
    const charArray = [];
    for await (const chunk of stream) {
      charArray.push(chunk);
    }
    return charArray.join("");
  }

  async function validateOutput(input: InstantRecipeStreamInput) {
    const tokenStream = new InstantRecipeStream();
    const stream = await tokenStream.getStream(input);
    const outputRaw = await processStream(stream);
    const outputSanitized = sanitizeOutput(outputRaw);
    const outputJSON = jsYaml.load(outputSanitized);

    const result = InstantRecipePredictionOutputSchema.safeParse(outputJSON);

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

  it("should generate a Mediterranean feast correctly", async () => {
    await validateOutput({
      prompt: "Mediterranean feast dishes",
      tokens: ["hummus", "falafel"],
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
