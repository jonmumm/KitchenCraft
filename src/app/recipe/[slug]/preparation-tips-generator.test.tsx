import { renderServerComponent } from "@/test/utils";
import { expect, test } from "vitest";
import PreparationTipsGenerator from "./preparation-tips-generator";
import { Recipe } from "@/types";

const recipes = [
  {
    name: "Caprese Salad",
    description:
      "A simple and refreshing salad made with sliced Roma tomatoes, fresh mozzarella, basil leaves, and a drizzle of balsamic glaze.",
    tags: ["Appetizer", "Vegetarian", "Gluten-free"],
    ingredients: [
      "4 large Roma tomatoes, sliced",
      "16 oz fresh mozzarella, sliced",
      "1/4 cup fresh basil leaves, torn or chopped",
      "Balsamic glaze for drizzling",
      "Salt and pepper to taste",
    ],
    instructions: [
      "On a large serving platter or individual plates, arrange the sliced Roma tomatoes and mozzarella.",
      "Sprinkle salt and pepper to taste.",
      "Scatter the torn basil leaves over the tomatoes and mozzarella.",
      "Drizzle with balsamic glaze.",
      "Serve immediately.",
    ],
  },
];

const recipesByName: Record<string, (typeof recipes)[0]> = {};
for (const recipe of recipes) {
  recipesByName[recipe.name] = recipe;
}

const recipeNames = recipes.map(({ name }) => name);

test.each(recipeNames)("PreparationTipsGenerator: %s", async (name) => {
  const testPromise = new Promise<void>(async (resolve, reject) => {
    const recipe = recipesByName[name];

    const jsx = await PreparationTipsGenerator({
      input: { recipe },
      onError(error, outputRaw) {
        console.error("failed with error", error);
        console.error("Output:");
        console.error(outputRaw);
        reject(error);
      },
      onComplete(output) {
        resolve();
      },
    });

    renderServerComponent(jsx);
  });

  // Wait for the promise to resolve (onComplete is called) or reject (onError is called).
  await testPromise;
});
