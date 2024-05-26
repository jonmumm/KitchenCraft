import { assert } from "@/lib/utils";
import { Observable } from "rxjs";
import { describe, expect, it } from "vitest";
import {
  SuggestTokensEvent,
  SuggestTokensOutput,
  SuggestTokensOutputSchema,
  SuggestTokensStream,
} from "./suggest-tokens.stream";

describe("SuggestTokensStream", () => {
  async function processStream(
    observable: Observable<SuggestTokensEvent>
  ): Promise<SuggestTokensOutput> {
    return new Promise((resolve, reject) => {
      let completeData: SuggestTokensOutput | null = null;
      observable.subscribe({
        next: (event: SuggestTokensEvent) => {
          if (event.type === "SUGGEST_TOKENS_COMPLETE") {
            completeData = event.data;
            resolve(event.data);
          }
        },
        error: (err: any) => reject(err),
      });
    });
  }

  async function validateOutput(input: {
    timeContext: string;
    personalizationContext: string;
  }) {
    const tokenStream = new SuggestTokensStream();
    const observableStream = tokenStream.getObservable(
      input
    ) as Observable<SuggestTokensEvent>;
    const outputData = await processStream(observableStream);

    const result = SuggestTokensOutputSchema.safeParse(outputData);
    assert(result.success, "expected result to be success");
    expect(result.data.tokens.length).toBeGreaterThanOrEqual(6); // Check if at least six tokens are generated
    expect(result.data.tokens.length).toBeLessThanOrEqual(12); // Check if at most twelve tokens are generated
    result.data.tokens.forEach((token) => {
      expect(typeof token).toBe("string");
    });
  }

  it("should generate valid token suggestions for a morning context", async () => {
    await validateOutput({
      timeContext: "morning",
      personalizationContext: "healthy breakfast",
    });
  });

  it("should generate valid token suggestions for an afternoon context", async () => {
    await validateOutput({
      timeContext: "afternoon",
      personalizationContext: "quick lunch",
    });
  });

  it("should generate valid token suggestions for an evening context", async () => {
    await validateOutput({
      timeContext: "evening",
      personalizationContext: "dinner ideas",
    });
  });

  it("should generate valid token suggestions for a weekend context", async () => {
    await validateOutput({
      timeContext: "weekend",
      personalizationContext: "brunch recipes",
    });
  });

  it("should generate valid token suggestions for a holiday context", async () => {
    await validateOutput({
      timeContext: "holiday",
      personalizationContext: "festive meals",
    });
  });
});
