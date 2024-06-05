import { assert } from "@/lib/utils";
import { Observable } from "rxjs";
import { describe, expect, it } from "vitest";
import {
  FeedTopicsEvent,
  FeedTopicsOutput,
  FeedTopicsOutputSchema,
  FeedTopicsStream,
} from "./feed-topics.stream"; // Assuming your file is named 'feed-topics.stream.ts'

describe("FeedTopicsStream", () => {
  async function processStream(
    observable: Observable<FeedTopicsEvent>
  ): Promise<FeedTopicsOutput> {
    return new Promise((resolve, reject) => {
      let completeData: FeedTopicsOutput | null = null;
      observable.subscribe({
        next: (event: FeedTopicsEvent) => {
          if (event.type === "FEED_TOPICS_COMPLETE") {
            completeData = event.data;
            resolve(event.data);
          }
        },
        error: (err: any) => reject(err),
      });
    });
  }

  async function validateOutput(input: {
    preferences: Record<number, number>;
    personalizationContext: string;
  }) {
    const stream = new FeedTopicsStream();
    const observableStream = stream.getObservable(
      input
    ) as Observable<FeedTopicsEvent>;
    const outputData = await processStream(observableStream);

    const result = FeedTopicsOutputSchema.safeParse(outputData);
    assert(result.success, "expected result to be success");
    console.log(result.data);
    expect(result.data.topics.length).toEqual(20); // Check if exactly 16 topics are generated

    result.data.topics.forEach((topic) => {
      expect(typeof topic).toBe("string");
    });
  }

  it("should generate a valid set of feed topics for a healthy eating context", async () => {
    await validateOutput({
      personalizationContext:
        "I love cooking healthy meals with fresh ingredients.",
      preferences: {
        0: 0, // Quick meals
        2: 0, // Try new ingredients
        3: 0, // Healthy recipes
      },
    });
  });

  it("should generate a valid set of feed topics for a family cooking context", async () => {
    await validateOutput({
      personalizationContext:
        "I enjoy cooking hearty dinners for my family. We love comfort food.",
      preferences: {
        1: 1, // Often cook for a group
        3: 1, // Comfort food
      },
    });
  });

  it("should generate a valid set of feed topics for a baking enthusiast context", async () => {
    await validateOutput({
      personalizationContext:
        "I love baking different kinds of bread and desserts.",
      preferences: {
        9: 0, // Often bake
        6: 0, // Prefer sweet dishes
      },
    });
  });

  it("should generate a valid set of feed topics for an experimental cook", async () => {
    await validateOutput({
      personalizationContext:
        "I enjoy trying new recipes and experimenting with international cuisines.",
      preferences: {
        5: 0, // Enjoy experimenting with new cuisines
        10: 0, // Enjoy making international dishes
      },
    });
  });

  it("should generate a valid set of feed topics for a gadget lover", async () => {
    await validateOutput({
      personalizationContext:
        "I like using my kitchen gadgets like the slow cooker and air fryer.",
      preferences: {
        16: 0, // Use kitchen gadgets
        19: 1, // Have more time to cook in the evenings
      },
    });
  });

  it("should generate a valid set of feed topics with no preferences", async () => {
    await validateOutput({
      personalizationContext:
        "I love cooking a variety of meals for my family.",
      preferences: {},
    });
  });
});
