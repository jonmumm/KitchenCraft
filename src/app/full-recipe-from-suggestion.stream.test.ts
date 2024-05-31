import { Observable } from "rxjs";
import { describe, expect, it } from "vitest";
import {
  FullRecipeFromSuggestionEvent,
  FullRecipeFromSuggestionStream,
  FullRecipeFromSuggestionInput,
  RecipeOutput,
  RecipeOutputSchema,
} from "./full-recipe-from-suggestion.stream";

describe("FullRecipeFromSuggestionsStream", () => {
  async function processStream(
    observable: Observable<FullRecipeFromSuggestionEvent>
  ): Promise<RecipeOutput> {
    return new Promise((resolve, reject) => {
      let completeData: RecipeOutput | null = null;
      observable.subscribe({
        next: (event: FullRecipeFromSuggestionEvent) => {
          if (event.type === "FULL_RECIPE_FROM_SUGGESTION_COMPLETE") {
            completeData = event.data;
            resolve(event.data);
          }
        },
        error: (err: any) => reject(err),
      });
    });
  }

  async function validateOutput(input: FullRecipeFromSuggestionInput) {
    const recipeStream = new FullRecipeFromSuggestionStream();
    const observableStream = recipeStream.getObservable(input) as Observable<FullRecipeFromSuggestionEvent>;
    const outputData = await processStream(observableStream);

    const result = RecipeOutputSchema.safeParse(outputData);
    expect(result.success).toBe(true);
  }

  it("should complete successfully for a vegan breakfast", async () => {
    await validateOutput({
      category: "Breakfast",
      name: "Vegan Blueberry Pancakes",
      tagline: "Fluffy pancakes loaded with blueberries, made entirely from plant-based ingredients.",
    });
  });

  it("should complete successfully for a gluten-free lunch", async () => {
    await validateOutput({
      category: "Lunch",
      name: "Quinoa Avocado Salad",
      tagline: "A refreshing salad with quinoa, ripe avocados, and a citrus dressing.",
    });
  });

  it("should complete successfully for quick snacks", async () => {
    await validateOutput({
      category: "Snack",
      name: "Cheesy Garlic Crackers",
      tagline: "Crisp crackers with a rich garlic cheese topping, perfect for snacking.",
    });
  });

  it("should complete successfully for an Italian dinner", async () => {
    await validateOutput({
      category: "Dinner",
      name: "Homemade Spaghetti Bolognese",
      tagline: "Classic spaghetti with a hearty and rich meat sauce.",
    });
  });

  it("should complete successfully for decadent desserts", async () => {
    await validateOutput({
      category: "Dessert",
      name: "Chocolate Lava Cake",
      tagline: "Molten chocolate cake with a gooey center, served warm.",
    });
  });

  it("should complete successfully for a seafood feast", async () => {
    await validateOutput({
      category: "Seafood",
      name: "Grilled Lobster Tails",
      tagline: "Succulent lobster tails grilled to perfection with herbs and butter.",
    });
  });

  it("should complete successfully for a barbecue night", async () => {
    await validateOutput({
      category: "Barbecue",
      name: "Smoky BBQ Ribs",
      tagline: "Tender ribs coated in a homemade BBQ sauce and slow-cooked over the grill.",
    });
  });

  it("should complete successfully for a healthy salad", async () => {
    await validateOutput({
      category: "Salad",
      name: "Kale and Nut Crunch Salad",
      tagline: "A hearty kale salad with a crunchy nut topping and a tangy vinaigrette.",
    });
  });

  it("should complete successfully for a comfort food dinner", async () => {
    await validateOutput({
      category: "Comfort Food",
      name: "Creamy Baked Macaroni and Cheese",
      tagline: "A creamy and comforting baked macaroni dish with a crispy cheese topping.",
    });
  });

  it("should complete successfully for an exotic dish", async () => {
    await validateOutput({
      category: "Exotic",
      name: "Thai Green Curry",
      tagline: "A spicy and aromatic Thai curry made with green chili, coconut milk, and fresh herbs.",
    });
  });
});
