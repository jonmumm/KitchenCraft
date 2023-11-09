import { sanitizeOutput } from "@/lib/sanitize";
import jsYaml from "js-yaml";
import { describe, expect, it } from "vitest";
import { z } from "zod";
import { SuggestionTokenStream } from "./stream";
import { SuggestionPredictionInput } from "@/types";
import { SuggestionPredictionOutputSchema } from "@/schema";

describe("SuggestionTokenStream", () => {
  async function processStream(stream: AsyncIterable<string>) {
    const charArray = [];
    for await (const chunk of stream) {
      charArray.push(chunk);
    }
    return charArray.join("");
  }

  async function validateOutput(input: SuggestionPredictionInput) {
    const tokenStream = new SuggestionTokenStream();
    const stream = await tokenStream.getStream(input);
    const outputRaw = await processStream(stream);
    const outputSanitized = sanitizeOutput(outputRaw);
    const outputJSON = jsYaml.load(outputSanitized);

    const result = SuggestionPredictionOutputSchema.safeParse(outputJSON);
    expect(result.success).toBe(true);
  }

  it("should handle prompt only input and produce valid YAML output", async () => {
    await validateOutput({ prompt: "Vegetarian dinner ideas" });
  });

  it("should handle ingredients only input and produce valid YAML output", async () => {
    await validateOutput({ ingredients: ["tofu", "mushrooms"] });
  });

  it("should handle tags only input and produce valid YAML output", async () => {
    await validateOutput({ tags: ["gluten-free", "quick"] });
  });

  it("should handle prompt with ingredients input and produce valid YAML output", async () => {
    await validateOutput({
      prompt: "Ideas for lunch",
      ingredients: ["chicken", "avocado"],
    });
  });

  it("should handle prompt with tags input and produce valid YAML output", async () => {
    await validateOutput({
      prompt: "Healthy breakfast options",
      tags: ["low-calorie", "high-protein"],
    });
  });

  it("should handle ingredients with tags input and produce valid YAML output", async () => {
    await validateOutput({
      ingredients: ["salmon", "quinoa"],
      tags: ["dinner", "healthy"],
    });
  });

  // ... add more test cases as needed
});
