import { assert } from "@/lib/utils";
import { Observable } from "rxjs";
import { describe, expect, it } from "vitest";
import {
  HomepageCategoriesStream,
  HomepageCategoriesOutput,
  HomepageCategoriesOutputSchema,
  HomepageCategoriesEvent,
} from "./homepage-categories.stream"; // Assuming your file is named 'homepage-categories.stream.ts'

describe("HomepageCategoriesStream", () => {
  async function processStream(
    observable: Observable<HomepageCategoriesEvent>
  ): Promise<HomepageCategoriesOutput> {
    return new Promise((resolve, reject) => {
      let completeData: HomepageCategoriesOutput | null = null;
      observable.subscribe({
        next: (event: HomepageCategoriesEvent) => {
          if (event.type === "HOMEPAGE_CATEGORIES_COMPLETE") {
            completeData = event.data;
            resolve(event.data);
          }
        },
        error: (err: any) => reject(err),
      });
    });
  }

  async function validateOutput(input: {
    recentFavorites?: string[];
    recentLiked?: string[];
    recentViewed?: string[];
    personalizationContext: string;
    timeContext: string;
  }) {
    const stream = new HomepageCategoriesStream();
    const observableStream = stream.getObservable(input) as Observable<HomepageCategoriesEvent>;
    const outputData = await processStream(observableStream);

    const result = HomepageCategoriesOutputSchema.safeParse(outputData);
    assert(result.success, "expected result to be success");
    expect(result.data.items.length).toEqual(6); // Check if at least one category is generated

    result.data.items.forEach(item => {
      expect(typeof item.category).toBe("string");
      expect(typeof item.description).toBe("string");
      expect(item.recipes.length).toBe(3); // Each category should have exactly 3 recipes

      item.recipes.forEach(recipe => {
        expect(typeof recipe.name).toBe("string");
        expect(typeof recipe.tagline).toBe("string");
      });
    });
  }

  it("should generate a valid content feed for a morning context", async () => {
    await validateOutput({
      timeContext: "morning",
      personalizationContext: "I'm a 36-year-old dad with 2 kids. I love cooking healthy breakfasts for my family.",
    });
  });

  it("should generate a valid content feed for an afternoon context", async () => {
    await validateOutput({
      timeContext: "afternoon",
      personalizationContext: "I'm a busy parent who needs quick lunch ideas for my kids and myself.",
    });
  });

  it("should generate a valid content feed for an evening context", async () => {
    await validateOutput({
      timeContext: "evening",
      personalizationContext: "I enjoy cooking hearty dinners for my family. We love comfort food.",
    });
  });

  it("should generate a valid content feed for a weekend context", async () => {
    await validateOutput({
      timeContext: "weekend",
      personalizationContext: "On weekends, I like to experiment with brunch recipes and new dishes.",
    });
  });

  it("should generate a valid content feed for a holiday context", async () => {
    await validateOutput({
      timeContext: "holiday",
      personalizationContext: "During holidays, I enjoy making festive meals and special treats for my family.",
    });
  });
});
