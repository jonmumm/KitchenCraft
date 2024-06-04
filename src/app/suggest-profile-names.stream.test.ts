import { assert } from "@/lib/utils";
import { Observable } from "rxjs";
import { describe, expect, it } from "vitest";
import {
  SuggestProfileNamesEvent,
  SuggestProfileNamesOutput,
  SuggestProfileNamesOutputSchema,
  SuggestProfileNamesStream,
} from "./suggest-profile-names.stream";

describe("SuggestProfileNamesStream", () => {
  async function processStream(
    observable: Observable<SuggestProfileNamesEvent>
  ): Promise<SuggestProfileNamesOutput> {
    return new Promise((resolve, reject) => {
      let completeData: SuggestProfileNamesOutput | null = null;
      observable.subscribe({
        next: (event: SuggestProfileNamesEvent) => {
          if (event.type === "SUGGEST_PROFILE_NAME_COMPLETE") {
            completeData = event.data;
            resolve(event.data);
          }
        },
        error: (err: any) => reject(err),
      });
    });
  }

  async function validateOutput(input: {
    email: string;
    previousSuggestions: string[];
    preferences: Record<number, number>;
    personalizationContext: string;
  }) {
    const profileNamesStream = new SuggestProfileNamesStream();
    const observableStream = profileNamesStream.getObservable(
      input
    ) as Observable<SuggestProfileNamesEvent>;
    const outputData = await processStream(observableStream);

    const result = SuggestProfileNamesOutputSchema.safeParse(outputData);
    assert(result.success, "expected result to be success");
    expect(result.data.names.length).toBe(6); // Check if six suggestions are generated
    console.log(result.data.names);
    result.data.names.forEach((name) => {
      expect(typeof name).toBe("string");
    });
  }

  it("should generate valid profile name suggestions with previous suggestions", async () => {
    await validateOutput({
      email: "user@example.com",
      previousSuggestions: ["BakingJohn", "VanillaTony"],
      preferences: { 1: 5, 2: 3 },
      personalizationContext: "chef names",
    });
  });

  it("should generate valid profile name suggestions with no previous suggestions", async () => {
    await validateOutput({
      email: "user@example.com",
      previousSuggestions: [],
      preferences: { 1: 5, 2: 3 },
      personalizationContext: "username styles",
    });
  });

  it("should generate valid profile name suggestions with varied preferences", async () => {
    await validateOutput({
      email: "user@example.com",
      previousSuggestions: ["TokyoChef"],
      preferences: { 1: 2, 3: 5 },
      personalizationContext: "foodie nicknames",
    });
  });

  it("should generate valid profile name suggestions for a specific personalization context", async () => {
    await validateOutput({
      email: "user@example.com",
      previousSuggestions: ["BakingJohn"],
      preferences: { 2: 4, 3: 1 },
      personalizationContext: "creative usernames",
    });
  });

  it("should generate valid profile name suggestions with complex previous suggestions", async () => {
    await validateOutput({
      email: "user@example.com",
      previousSuggestions: ["DenverCookSmith", "vanilla_tony"],
      preferences: { 1: 3, 4: 2 },
      personalizationContext: "nickname generator",
    });
  });
});
