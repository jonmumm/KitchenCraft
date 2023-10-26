import { renderServerComponent } from "@/test/utils";
import { expect, test } from "vitest";
import SuggestionsGenerator from "./suggestions-generator";

const suggestionPrompts: string[] = [
  "chocolate desserts",
  "vegan breakfast ideas",
  "dishes using quinoa",
  "traditional Italian pasta",
  "gluten-free appetizers",
  "soups for winter",
  "spicy Asian cuisine",
  "recipes with avocado",
  "low-carb desserts",
  "meals under 30 minutes",
  "Mediterranean salads",
  "high protein vegetarian dishes",
  "Japanese sushi variations",
  "grilled summer dishes",
  "comfort foods",
  "diabetic-friendly meals",
  "recipes using coconut milk",
  "French bakery items",
  "smoothies for energy",
  "holiday-themed cookies",
  "dishes using only five ingredients",
  "Indian street food",
  "seafood dishes for a dinner party",
  "vegan alternatives for meat dishes",
  "kid-friendly snacks",
  "recipes with matcha",
  "Brazilian carnival foods",
  "meals for a picnic",
  "vegan protein sources",
  "no-bake desserts",
];

test.each(suggestionPrompts)("SuggestionsGenerator: %s", async (prompt) => {
  const testPromise = new Promise<void>(async (resolve, reject) => {
    const input = { prompt };

    const jsx = await SuggestionsGenerator({
      input,
      onStart() {
        console.log("started", input);
      },
      onError(error, outputRaw) {
        console.error("failed with error", error);
        console.error("Output:");
        console.error(outputRaw);
        reject(error);
      },
      // onProgress(output) {
      //   console.log(output);
      // },
      onComplete(output) {
        resolve();
      },
    });

    renderServerComponent(jsx);
  });

  // Wait for the promise to resolve (onComplete is called) or reject (onError is called).
  await testPromise;
  expect(true).toBe(true);
});
