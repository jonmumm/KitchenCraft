import { sanitizeOutput } from "@/lib/sanitize";
import jsYaml from "js-yaml";
import { describe, expect, it } from "vitest";
import {
  AutoSuggestTokensOutputSchema,
  AutoSuggestTokensStream,
} from "./auto-suggest-tokens.stream";

// Mocking a function to simulate processing of the token stream
async function processStream(stream: AsyncIterable<string>) {
  const tokens = [];
  for await (const token of stream) {
    tokens.push(token);
  }
  return tokens.join("");
}

describe("AutoSuggestTokensStream", () => {
  // Helper function to validate output against the AutoSuggestTokensOutputSchema
  async function validateOutput(userInput: { prompt: string }) {
    const tokenStream = new AutoSuggestTokensStream();
    const stream = await tokenStream.getStream(userInput);
    const outputRaw = await processStream(stream);
    const outputSanitized = sanitizeOutput(outputRaw);
    const outputJSON = jsYaml.load(outputSanitized);

    const result = AutoSuggestTokensOutputSchema.safeParse(outputJSON);
    expect(result.success).toBe(true);
    return result.success ? result.data : null;
  }

  it("should generate a valid list of string tokens", async () => {
    const data = await validateOutput({ prompt: "dessert ideas" });
    expect(Array.isArray(data?.tokens)).toBe(true);
    data?.tokens.forEach((token) => {
      expect(typeof token).toBe("string");
    });
  });

  it("should generate tokens relevant to a culinary theme", async () => {
    const data = await validateOutput({ prompt: "quick dinner recipes" });
    expect(data?.tokens.length).toBeGreaterThan(0); // Ensuring there are suggestions
  });

  it("should correctly process multiple keywords input", async () => {
    const data = await validateOutput({ prompt: "vegan cheese" });
    expect(data?.tokens.length).toBeGreaterThan(0);
  });

  it("should return a correct structure even for complex queries", async () => {
    const data = await validateOutput({
      prompt: "low carb breakfast options under 300 calories",
    });
    expect(data?.tokens.length).toBeGreaterThan(0);
  });
});
