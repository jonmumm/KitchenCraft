import { renderServerComponent } from "@/test/utils";
import { test } from "vitest";
import { YamlFixer } from "./yaml-fixer";
import jsYaml from "js-yaml";
import { getErrorMessage } from "@/lib/error";

const BAD_YAML = `recipe:
yield: "6 servings"
activeTime: "PT30M"
cookTime: "PT30M"
totalTime: "PT1H"
tags:
  - "Soup"
  - "Vegetarian"
  - "Comfort Food"
ingredients:
  - "2 cups whole milk"
  - "4 cups corn kernels, fresh or frozen"
  - "1 large onion, diced"
  - "2 carrots, diced"
  - "2 celery stalks, diced"
  - "2 cloves garlic, minced"
  - "2 tbsp butter"
  - "2 tbsp all-purpose flour"
  - "1/2 tsp dried thyme"
  - "1/2 tsp dried oregano"
  - "1/2 tsp dried basil"
  - "1/2 tsp salt"
  - "1/4 tsp black pepper"
  - "1/4 tsp cayenne pepper (optional, for spice)
  - "1/4 tsp nutmeg (optional, for a hint of warmth)"
  - "2 cups vegetable broth"
  - "1/2 cup heavy cream"
instructions:
  - "In a large pot, melt the butter over medium heat. Add the onion, carrots, and celery, cooking until softened, about 5 minutes."
  - "Add the garlic and cook for another minute."
  - "Stir in the flour, thyme, oregano, basil, salt, black pepper, and cayenne pepper (if using). Cook for 1 minute."
  - "Gradually whisk in the whole milk and vegetable broth. Bring to a simmer."
  - "Add the corn kernels and nutmeg (if using). Simmer for 15-20 minutes, or until the vegetables are tender."
  - "Stir in the heavy cream and adjust seasonings to taste."
  - "Serve hot with crusty bread or a salad."`;

test("yaml-fixer: fixes bad yaml", async () => {
  try {
    jsYaml.load(BAD_YAML);
  } catch (ex) {
    const testPromise = new Promise<void>(async (resolve, reject) => {
      const jsx = await YamlFixer({
        input: {
          badYaml: BAD_YAML,
          error: getErrorMessage(ex),
        },
        onError(error, outputRaw) {
          console.error("failed with error", error);
          console.error("Output:");
          console.error(outputRaw);
          reject(error);
        },
        onComplete(output) {
          jsYaml.load(output);
          resolve();
        },
      });

      renderServerComponent(jsx);
    });

    await testPromise;
  }
});
