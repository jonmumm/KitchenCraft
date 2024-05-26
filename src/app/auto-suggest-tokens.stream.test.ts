import { Observable } from "rxjs";
import { describe, expect, it } from "vitest";
import {
  AutoSuggestTokensEvent,
  AutoSuggestTokensOutput,
  AutoSuggestTokensOutputSchema,
  AutoSuggestTokensStream,
} from "./auto-suggest-tokens.stream";

describe("AutoSuggestTokensStream", () => {
  async function processStream(
    observable: Observable<AutoSuggestTokensEvent>
  ): Promise<AutoSuggestTokensOutput> {
    return new Promise((resolve, reject) => {
      let completeData: AutoSuggestTokensOutput | null = null;
      observable.subscribe({
        next: (event: AutoSuggestTokensEvent) => {
          if (event.type === "AUTO_SUGGEST_TOKENS_COMPLETE") {
            completeData = event.data;
            resolve(event.data);
          }
        },
        error: (err: any) => reject(err),
      });
    });
  }

  async function validateOutput(input: { prompt: string }) {
    const tokenStream = new AutoSuggestTokensStream();
    const observableStream = tokenStream.getObservable(
      input
    ) as Observable<AutoSuggestTokensEvent>;
    const outputData = await processStream(observableStream);

    const result = AutoSuggestTokensOutputSchema.safeParse(outputData);
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

  it("should handle punctuation and special characters in the prompt", async () => {
    const data = await validateOutput({ prompt: "what's for dinner?" });
    expect(data?.tokens.length).toBeGreaterThan(0);
  });

  it("should return relevant tokens for prompts with numbers", async () => {
    const data = await validateOutput({ prompt: "10 easy snack ideas" });
    expect(data?.tokens.length).toBeGreaterThan(0);
  });

  it("should handle variations in capitalization and white spaces", async () => {
    const data = await validateOutput({ prompt: "  Healthy  Lunch  Options" });
    expect(data?.tokens.length).toBeGreaterThan(0);
  });

  it("should return relevant tokens for prompts in different languages", async () => {
    const data = await validateOutput({ prompt: "idées de plats végétaliens" });
    expect(data?.tokens.length).toBeGreaterThan(0);
  });

  it("should handle prompts with a combination of words and numbers", async () => {
    const data = await validateOutput({ prompt: "top 5 desserts" });
    expect(data?.tokens.length).toBeGreaterThan(0);
  });

  it("should return relevant tokens for prompts with abbreviations", async () => {
    const data = await validateOutput({ prompt: "DIY snack ideas" });
    expect(data?.tokens.length).toBeGreaterThan(0);
  });
});
