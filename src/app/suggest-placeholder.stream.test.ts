import { assert } from "@/lib/utils";
import { Observable } from "rxjs";
import { describe, expect, it } from "vitest";
import {
  SuggestPlaceholderEvent,
  SuggestPlaceholderOutput,
  SuggestPlaceholderOutputSchema,
  SuggestPlaceholderStream,
} from "./suggest-placeholder.stream";

describe("SuggestPlaceholderStream", () => {
  async function processStream(
    observable: Observable<SuggestPlaceholderEvent>
  ): Promise<SuggestPlaceholderOutput> {
    return new Promise((resolve, reject) => {
      let completeData: SuggestPlaceholderOutput | null = null;
      observable.subscribe({
        next: (event: SuggestPlaceholderEvent) => {
          if (event.type === "SUGGEST_PLACEHOLDERS_COMPLETE") {
            completeData = event.data;
            resolve(event.data);
          }
        },
        error: (err: any) => reject(err),
      });
    });
  }

  async function validateOutput(input: { timeContext: string; personalizationContext: string }) {
    const placeholderStream = new SuggestPlaceholderStream();
    const observableStream = placeholderStream.getObservable(
      input
    ) as Observable<SuggestPlaceholderEvent>;
    const outputData = await processStream(observableStream);

    const result = SuggestPlaceholderOutputSchema.safeParse(outputData);
    assert(result.success, "expected result to be success");
    expect(result.data.items.length).toBe(6); // Check if six suggestions are generated
    result.data.items.forEach((item) => {
      expect(typeof item).toBe("string");
    });
  }

  it("should generate valid placeholder suggestions for a morning context", async () => {
    await validateOutput({
      timeContext: "morning",
      personalizationContext: "healthy breakfast",
    });
  });

  it("should generate valid placeholder suggestions for an afternoon context", async () => {
    await validateOutput({
      timeContext: "afternoon",
      personalizationContext: "quick lunch",
    });
  });

  it("should generate valid placeholder suggestions for an evening context", async () => {
    await validateOutput({
      timeContext: "evening",
      personalizationContext: "dinner ideas",
    });
  });

  it("should generate valid placeholder suggestions for a weekend context", async () => {
    await validateOutput({
      timeContext: "weekend",
      personalizationContext: "brunch recipes",
    });
  });

  it("should generate valid placeholder suggestions for a holiday context", async () => {
    await validateOutput({
      timeContext: "holiday",
      personalizationContext: "festive meals",
    });
  });
});
