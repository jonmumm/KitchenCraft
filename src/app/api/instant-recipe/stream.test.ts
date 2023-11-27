import { sanitizeOutput } from "@/lib/sanitize";
import { InstantRecipeMetadataPredictionOutputSchema } from "@/schema";
import { InstantRecipeMetadataPredictionInput } from "@/types";
import jsYaml from "js-yaml";
import { describe, expect, it } from "vitest";
import { InstantRecipeMetadataStream } from "./stream";

describe("InstantRecipeMetdataTokenStream", () => {
  async function processStream(stream: AsyncIterable<string>) {
    const charArray = [];
    for await (const chunk of stream) {
      charArray.push(chunk);
    }
    return charArray.join("");
  }

  async function validateOutput(input: InstantRecipeMetadataPredictionInput) {
    const tokenStream = new InstantRecipeMetadataStream();
    const stream = await tokenStream.getStream(input);
    const outputRaw = await processStream(stream);
    const outputSanitized = sanitizeOutput(outputRaw);
    const outputJSON = jsYaml.load(outputSanitized);

    const result =
      InstantRecipeMetadataPredictionOutputSchema.safeParse(outputJSON);
    expect(result.success).toBe(true);
  }

  it("should handle prompt only input and produce valid YAML output", async () => {
    await validateOutput({ prompt: "Vegetarian dinner ideas" });
  });

  it("should handle a global fusion cuisine prompt", async () => {
    await validateOutput({
      prompt:
        "Create a recipe that combines Italian pasta with traditional Indian spices, suitable for a vegetarian diet.",
    });
  });

  it("should handle a diet-specific request", async () => {
    await validateOutput({
      prompt:
        "I need a keto-friendly breakfast recipe that uses eggs, avocado, and spinach, and can be prepared in under 20 minutes.",
    });
  });

  it("should handle a seasonal ingredient highlight", async () => {
    await validateOutput({
      prompt:
        "Devise a dessert recipe that features pumpkin as the main ingredient, perfect for a fall evening.",
    });
  });

  it("should handle a historical recipe adaptation", async () => {
    await validateOutput({
      prompt:
        "Can you modify a traditional French coq au vin recipe to be vegan, using modern plant-based substitutes?",
    });
  });

  it("should handle a children's favorite", async () => {
    await validateOutput({
      prompt:
        "Suggest a healthy, fun, and easy-to-make snack recipe for kids, involving fruits and a dipping sauce.",
    });
  });

  it("should handle a gourmet challenge", async () => {
    await validateOutput({
      prompt:
        "Design a gourmet three-course meal recipe that includes a soup, main course, and dessert, each featuring mushrooms as a key ingredient.",
    });
  });

  it("should handle a cultural specialty", async () => {
    await validateOutput({
      prompt:
        "Provide a traditional Mexican taco recipe, including homemade salsa and guacamole, suitable for a family dinner.",
    });
  });

  it("should handle a cooking technique focus", async () => {
    await validateOutput({
      prompt:
        "I'd like a recipe that centers around slow cooking, ideally using beef and root vegetables, for a hearty winter meal.",
    });
  });

  it("should handle an ingredient limitation", async () => {
    await validateOutput({
      prompt:
        "Create a delicious stir-fry recipe using only five ingredients: chicken, broccoli, soy sauce, garlic, and rice.",
    });
  });

  it("should handle a health-conscious meal", async () => {
    await validateOutput({
      prompt:
        "Develop a recipe for a heart-healthy salad that includes quinoa, mixed greens, nuts, and a homemade vinaigrette dressing.",
    });
  });
});
