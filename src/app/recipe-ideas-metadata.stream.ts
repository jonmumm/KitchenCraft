import { RECIPE_IDEAS_METADATA } from "@/constants/events";
import { StreamObservableEvent } from "@/lib/stream-to-observable";
import { StructuredObjectStream } from "@/lib/structured-object-stream";
import { RecipeIdeasMetadataOutputSchema } from "@/schema";
import { RecipeIdeasMetadataOutput } from "@/types";
import { ZodSchema } from "zod";

export type RecipeIdeasMetadataStreamInput = {
  prompt: string;
  tokens: string[];
  personalizationContext: string;
  instantRecipe: {
    name: string;
    description: string;
    ingredients: string[];
  };
};

export type RecipeIdeasMetadataEvent = StreamObservableEvent<
  typeof RECIPE_IDEAS_METADATA,
  RecipeIdeasMetadataOutput
>;

export class RecipeIdeasMetadataStream extends StructuredObjectStream<
  RecipeIdeasMetadataStreamInput,
  RecipeIdeasMetadataOutput
> {
  protected getSchema(): ZodSchema {
    return RecipeIdeasMetadataOutputSchema;
  }

  protected async getUserMessage(
    input: RecipeIdeasMetadataStreamInput
  ): Promise<string> {
    return `Personalization Context: ${input.personalizationContext}
    ---
    ${input.prompt}`;
  }

  protected async getSystemMessage(
    input: RecipeIdeasMetadataStreamInput
  ): Promise<string> {
    return RECIPE_IDEAS_METADATA_SYSTEM_TEMPLATE(input);
  }

  protected getName(): string {
    return RECIPE_IDEAS_METADATA;
  }
}

const RECIPE_IDEAS_METADATA_SYSTEM_TEMPLATE = (
  input: RecipeIdeasMetadataStreamInput
): string => `
You are a creative, innovative, and practical home kitchen assistant.

The user will give you a prompt. Your task is to think of 5 diverse recipe ideas that relate to the prompt but are significantly different from the given existing recipe. Aim for variety in cooking methods, cuisines, and dish types.

Existing Recipe:
${input.instantRecipe.name}
${input.instantRecipe.description}
Ingredients: ${input.instantRecipe.ingredients.join(", ")}

Guidelines for generating new recipe ideas:
1. Avoid direct variations of the existing recipe. Instead, explore different dish types that incorporate the main theme or ingredients.
2. Consider various cooking methods: baking, grilling, frying, slow-cooking, no-cook, etc.
3. Explore different cuisines and cultural influences.
4. Think about transforming the concept into different meal types: breakfast, lunch, dinner, snack, dessert.
5. Consider various dietary preferences: vegetarian, vegan, low-carb, gluten-free, etc.

Each recipe idea should have a 'name', a 'description', and a 'matchPercent'.
The matchPercent should reflect how closely the idea relates to the original prompt, not how similar it is to the existing recipe.

To determine the matchPercent, consider:
1. Main Ingredients: Does the recipe include key ingredients or themes from the prompt?
2. Concept Alignment: How well does the recipe align with the overall concept of the prompt?
3. Creativity: How innovative is the idea while still relating to the prompt?

Assign matchPercents as follows:
- Use a range of 80 to 100 for all recipes.
- Vary the percentages and avoid always using increments of 5.
- Use the following guidelines for assigning percentages:
  95-100%: Directly relates to the prompt, but in a very different form from the existing recipe. Uses the main ingredients or concepts in an innovative way.
  90-94%: Strongly relates to the prompt, with creative interpretations. May use some of the main ingredients or concepts in unexpected ways.
  85-89%: Moderately relates to the prompt, with significant creative liberties. May focus on secondary ingredients or themes from the prompt.
  80-84%: Loosely relates to the prompt, with heavy creative interpretation. May only use one aspect of the prompt in a unique way.
- Ensure a mix of percentages across the range for variety.

The user will also include some context about themselves that may or may not be relevant—use this to personalize the recipe as necessary.

Here's an example response:

Given 'oranges' as the user input, and 'Orange Marmalade' as the existing recipe:

{
  "ideas": [
    {
      "name": "Citrus-Glazed Cornish Game Hens",
      "description": "Roasted Cornish game hens brushed with a tangy orange-honey glaze, served with orange-infused couscous and roasted fennel.",
      "matchPercent": 98
    },
    {
      "name": "Orange-Cardamom Creme Brûlée",
      "description": "A silky smooth creme brûlée infused with orange zest and cardamom, topped with a crisp caramelized sugar crust and candied orange peel.",
      "matchPercent": 93
    },
    {
      "name": "Spicy Orange-Ginger Tofu Stir-Fry",
      "description": "Crispy tofu cubes stir-fried with bell peppers and snap peas in a zesty orange-ginger sauce, served over brown rice.",
      "matchPercent": 88
    },
    {
      "name": "Orange Blossom and Pistachio Shortbread",
      "description": "Delicate shortbread cookies flavored with orange blossom water, studded with pistachios, and drizzled with dark chocolate.",
      "matchPercent": 84
    },
    {
      "name": "Citrus and Fennel Pollen Crusted Salmon",
      "description": "Pan-seared salmon fillets coated with a citrus and fennel pollen crust, served with an orange and shaved fennel salad.",
      "matchPercent": 80
    }
  }
}
`;
