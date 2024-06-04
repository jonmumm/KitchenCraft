import { assert } from "@/lib/utils";
import { Observable } from "rxjs";
import { describe, expect, it } from "vitest";
import {
  WelcomeMessageEvent,
  WelcomeMessageOutput,
  WelcomeMessageOutputSchema,
  WelcomeMessageStream,
} from "./welcome-message.stream";

describe("WelcomeMessageStream", () => {
  async function processStream(
    observable: Observable<WelcomeMessageEvent>
  ): Promise<WelcomeMessageOutput> {
    return new Promise((resolve, reject) => {
      let completeData: WelcomeMessageOutput | null = null;
      observable.subscribe({
        next: (event: WelcomeMessageEvent) => {
          if (event.type === "WELCOME_MESSAGE_COMPLETE") {
            completeData = event.data;
            resolve(event.data);
          }
        },
        error: (err: any) => reject(err),
      });
    });
  }

  async function validateOutput(input: {
    profileName: string;
    preferences: Record<number, number>;
    personalizationContext: string;
  }) {
    const welcomeMessageStream = new WelcomeMessageStream();
    const observableStream = welcomeMessageStream.getObservable(
      input
    ) as Observable<WelcomeMessageEvent>;
    const outputData = await processStream(observableStream);

    const result = WelcomeMessageOutputSchema.safeParse(outputData);
    assert(result.success, "expected result to be success");
    console.log(result.data);
    expect(typeof result.data.message).toBe("string");
    expect(result.data.followUpQuestions.length).toBe(3); // Check if three follow-up questions are generated
    result.data.followUpQuestions.forEach((question) => {
      expect(typeof question).toBe("string");
    });
  }

  it("should generate valid welcome message with typical preferences", async () => {
    await validateOutput({
      profileName: "NYChef123",
      preferences: {
        0: 0,
        1: 0,
        2: 0,
        3: 0,
        4: 0,
        5: 0,
        6: 0,
        7: 0,
        8: 0,
        9: 0,
        10: 0,
        11: 0,
        12: 0,
        13: 0,
        14: 0,
        15: 0,
        16: 0,
        17: 0,
        18: 0,
        19: 0,
      },
      personalizationContext: "quick and healthy meals",
    });
  });

  it("should generate valid welcome message with diverse preferences", async () => {
    await validateOutput({
      profileName: "GourmetChef",
      preferences: {
        0: 1,
        1: 1,
        2: 1,
        3: 1,
        4: 1,
        5: 1,
        6: 1,
        7: 1,
        8: 1,
        9: 1,
        10: 1,
        11: 1,
        12: 1,
        13: 1,
        14: 1,
        15: 1,
        16: 1,
        17: 1,
        18: 1,
        19: 1,
      },
      personalizationContext: "elaborate and comfort food",
    });
  });

  it("should generate valid welcome message with mixed preferences", async () => {
    await validateOutput({
      profileName: "BalancedCook",
      preferences: {
        0: 0,
        1: 1,
        2: 0,
        3: 1,
        4: 0,
        5: 1,
        6: 0,
        7: 1,
        8: 0,
        9: 1,
        10: 0,
        11: 1,
        12: 0,
        13: 1,
        14: 0,
        15: 1,
        16: 0,
        17: 1,
        18: 0,
        19: 1,
      },
      personalizationContext: "mix of quick and elaborate meals",
    });
  });

  it("should generate valid welcome message with minimal preferences", async () => {
    await validateOutput({
      profileName: "MinimalistChef",
      preferences: {
        0: 0,
        1: 0,
        2: 1,
        3: 1,
        4: 0,
        5: 0,
        6: 1,
        7: 0,
        8: 1,
        9: 0,
        10: 0,
        11: 1,
        12: 0,
        13: 1,
        14: 0,
        15: 0,
        16: 1,
        17: 0,
        18: 1,
        19: 0,
      },
      personalizationContext: "simple and quick recipes",
    });
  });

  it("should generate valid welcome message with comprehensive preferences", async () => {
    await validateOutput({
      profileName: "CompleteChef",
      preferences: {
        0: 1,
        1: 0,
        2: 1,
        3: 0,
        4: 1,
        5: 0,
        6: 1,
        7: 0,
        8: 1,
        9: 0,
        10: 1,
        11: 0,
        12: 1,
        13: 0,
        14: 1,
        15: 0,
        16: 1,
        17: 0,
        18: 1,
        19: 0,
      },
      personalizationContext: "detailed and varied cooking preferences",
    });
  });
});
