import { sanitizeOutput } from "@/lib/sanitize";
import { IdeasPredictionOutputSchema } from "@/schema";
import { DietaryAlternativesPredictionInput } from "@/types";
import jsYaml from "js-yaml";
import { describe, expect, it } from "vitest";

// Assuming the JSON file is located in the same directory and named 'sample-recipes.json'
import sampleRecipes from "@/data/sample-recipes.json";
import { DietaryAlternativesTokenStream } from "./stream";

describe("DietaryAlternativesTokenStream", () => {
  async function processStream(stream: AsyncIterable<string>) {
    const charArray = [];
    for await (const chunk of stream) {
      charArray.push(chunk);
    }
    return charArray.join("");
  }

  async function validateOutput(input: DietaryAlternativesPredictionInput) {
    const tokenStream = new DietaryAlternativesTokenStream();
    const stream = await tokenStream.getStream(input);
    const outputRaw = await processStream(stream);
    const outputSanitized = sanitizeOutput(outputRaw);
    const outputJSON = jsYaml.load(outputSanitized);

    const result = IdeasPredictionOutputSchema.safeParse(outputJSON);
    expect(result.success).toBe(true);
  }

  // Loop through each recipe in the sample file and create a test case
  sampleRecipes.forEach((recipe, index) => {
    it(`should process recipe #${index + 1}: ${
      recipe.name
    } and produce valid YAML output`, async () => {
      const input: DietaryAlternativesPredictionInput = { recipe };
      await validateOutput(input);
    });
  });
});
