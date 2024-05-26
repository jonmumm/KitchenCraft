import { Observable } from "rxjs";
import { describe, expect, it } from "vitest";
import {
  FullRecipeEvent,
  RecipeOutput,
  RecipeOutputSchema,
  FullRecipeStream,
  FullRecipeStreamInput,
} from "./full-recipe.stream";

describe("FullRecipeStream", () => {
  async function processStream(
    observable: Observable<FullRecipeEvent>
  ): Promise<RecipeOutput> {
    return new Promise((resolve, reject) => {
      let completeData: RecipeOutput | null = null;
      observable.subscribe({
        next: (event: FullRecipeEvent) => {
          if (event.type === "FULL_RECIPE_COMPLETE") {
            completeData = event.data;
            resolve(event.data);
          }
        },
        error: (err: any) => reject(err),
      });
    });
  }

  async function validateOutput(input: FullRecipeStreamInput) {
    const recipeStream = new FullRecipeStream();
    const observableStream = recipeStream.getObservable(input) as Observable<FullRecipeEvent>;
    const outputData = await processStream(observableStream);

    const result = RecipeOutputSchema.safeParse(outputData);
    expect(result.success).toBe(true);
  }

  it("should complete successfully for a vegan breakfast", async () => {
    await validateOutput({
      prompt: "Healthy vegan breakfast options",
      tokens: ["oatmeal", "fruit"],
      name: "Vegan Blueberry Pancakes",
      description:
        "Fluffy pancakes loaded with blueberries, made entirely from plant-based ingredients.",
    });
  });

  it("should complete successfully for a gluten-free lunch", async () => {
    await validateOutput({
      prompt: "Gluten-free lunch recipes",
      tokens: ["quinoa", "avocado"],
      name: "Quinoa Avocado Salad",
      description:
        "A refreshing salad with quinoa, ripe avocados, and a citrus dressing.",
    });
  });

  it("should complete successfully for quick snacks", async () => {
    await validateOutput({
      prompt: "Quick and easy snacks",
      tokens: ["cheese", "crackers"],
      name: "Cheesy Garlic Crackers",
      description:
        "Crisp crackers with a rich garlic cheese topping, perfect for snacking.",
    });
  });

  it("should complete successfully for an Italian dinner", async () => {
    await validateOutput({
      prompt: "Traditional Italian dinner dishes",
      tokens: ["pasta", "tomato"],
      name: "Homemade Spaghetti Bolognese",
      description: "Classic spaghetti with a hearty and rich meat sauce.",
    });
  });

  it("should complete successfully for decadent desserts", async () => {
    await validateOutput({
      prompt: "Decadent desserts",
      tokens: ["chocolate", "cake"],
      name: "Chocolate Lava Cake",
      description: "Molten chocolate cake with a gooey center, served warm.",
    });
  });

  it("should complete successfully for a seafood feast", async () => {
    await validateOutput({
      prompt: "Seafood recipes for a feast",
      tokens: ["shrimp", "lobster"],
      name: "Grilled Lobster Tails",
      description:
        "Succulent lobster tails grilled to perfection with herbs and butter.",
    });
  });

  it("should complete successfully for a barbecue night", async () => {
    await validateOutput({
      prompt: "Barbecue recipes for the family",
      tokens: ["ribs", "corn"],
      name: "Smoky BBQ Ribs",
      description:
        "Tender ribs coated in a homemade BBQ sauce and slow-cooked over the grill.",
    });
  });

  it("should complete successfully for a healthy salad", async () => {
    await validateOutput({
      prompt: "Refreshing and healthy salads",
      tokens: ["kale", "nuts"],
      name: "Kale and Nut Crunch Salad",
      description:
        "A hearty kale salad with a crunchy nut topping and a tangy vinaigrette.",
    });
  });

  it("should complete successfully for a comfort food dinner", async () => {
    await validateOutput({
      prompt: "Comfort food recipes for a cozy night",
      tokens: ["macaroni", "cheese"],
      name: "Creamy Baked Macaroni and Cheese",
      description:
        "A creamy and comforting baked macaroni dish with a crispy cheese topping.",
    });
  });

  it("should complete successfully for an exotic dish", async () => {
    await validateOutput({
      prompt: "Exotic dishes from around the world",
      tokens: ["curry", "coconut"],
      name: "Thai Green Curry",
      description:
        "A spicy and aromatic Thai curry made with green chili, coconut milk, and fresh herbs.",
    });
  });
});
