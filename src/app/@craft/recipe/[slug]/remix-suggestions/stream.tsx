import { TokenStream } from "@/lib/token-stream";
import { FAQsPredictionInput, RemixSuggestionsPredictionInput } from "@/types";
import { PromptTemplate } from "langchain/prompts";

export class RemixSuggestionsTokenStream extends TokenStream<RemixSuggestionsPredictionInput> {
  protected async getUserMessage(
    input: RemixSuggestionsPredictionInput
  ): Promise<string> {
    return userMessageTemplate.format({
      name: input.recipe.name,
      description: input.recipe.description,
      yield: input.recipe.yield,
      cookTime: input.recipe.cookTime,
      tags: Array.isArray(input.recipe.tags)
        ? input.recipe.tags.join("\n")
        : "",
      ingredients: Array.isArray(input.recipe.ingredients)
        ? input.recipe.ingredients.join("\n")
        : "",
      instructions: Array.isArray(input.recipe.instructions)
        ? input.recipe.instructions.join("\n")
        : "",
    });
  }

  protected async getSystemMessage(
    input: FAQsPredictionInput
  ): Promise<string> {
    return TEMPLATE;
  }

  protected getDefaultTokens(): number {
    return 2048;
  }
}

const userMessageTemplate = PromptTemplate.fromTemplate(`
\`\`\`yaml
recipe:
  name: {name}
  description: {description}
  yield: {yield}
  cookTime: {cookTime}
  tags: {tags}
  ingredients: {ingredients}
  instructions: {instructions}
\`\`\`
`);

const TEMPLATE = `You are a creative, helpful and practical home kitchen assistant.

Help think of 6 ways I could modify this recipe, using different ingredients, techniques or yields.

Format the response in a YAML block. Each recipe suggestion should have both a 'name' and a 'description'. 
The top-level key should be "suggestions". Ensure the YAML format has appropriate white space for the list items under suggestions.

Here is an example response for a bell-pepper soup recipe:

\`\`\`yaml
suggestions:
  - name: "Creamy Coconut Twist"
    description: "Replace 1 cup of vegetable stock with coconut milk for a creamy texture and a hint of tropical flavor. This modification is great for those who enjoy a richer, more exotic taste profile."
  - name: "Spicy Chorizo Version"
    description: "Add diced chorizo to the soup for a spicy, meaty flavor. Brown the chorizo in the pot before adding the onions to infuse the oil with a smoky flavor. This would be a great option for non-vegetarian guests."
  - name: "Roasted Tomato and Herb Variation"
    description: "Add 2-3 medium-sized tomatoes, halved and roasted along with the bell peppers, and a mix of Italian herbs (basil, oregano, thyme) for a Mediterranean twist. This would add a tangy depth to the soup."
  - name: "Smoky Charred Corn Addition"
    description: "Incorporate charred corn kernels for a smoky, sweet element. You can roast the corn in the oven alongside the bell peppers or on a grill. This addition would add a delightful crunch and sweetness to the soup."
  - name: "Curried Bell Pepper Soup"
    description: "Introduce a teaspoon of curry powder and a pinch of turmeric when sautéing the onions to give the soup an Indian-inspired flavor. This would be perfect for those who enjoy a bit of warmth and complexity in their soups."
  - name: "Single-Serving and Freezer-Friendly"
    description: "Modify the yield by cooking a larger batch and then freezing individual servings. This is great for meal prep or for those who live alone. The soup can be frozen in single-serving containers and reheated for a quick and healthy meal."
\`\`\`

Another example for response a sourdough recipe:

\`\`\`yaml
suggestions:
  - name: "Seeded Crust Variation"
    description: "Before baking, brush the top of the dough with water and sprinkle a mix of sesame, poppy, and sunflower seeds for a crunchy, nutty crust. This adds both texture and flavor to the loaf."
  - name: "Herb and Garlic Infusion"
    description: "Incorporate minced garlic and a mix of dried herbs like rosemary, thyme, and oregano into the dough for a flavorful twist. This version is perfect for those who enjoy aromatic, herb-infused breads."
  - name: "Whole Grain Boost"
    description: "Replace 50g of the bread flour with an additional 50g of whole wheat flour for a denser, more nutritious loaf. This modification is ideal for health-conscious individuals who prefer whole grain breads."
  - name: "Olive and Sundried Tomato Addition"
    description: "Add chopped Kalamata olives and sundried tomatoes to the dough for a Mediterranean-inspired flavor. This combination works beautifully with the tanginess of the sourdough."
  - name: "Sweet Cinnamon Raisin Twist"
    description: "Mix in a handful of raisins and a teaspoon of cinnamon to the dough for a sweet and spicy variation. This is great for a breakfast bread or a delightful snack."
  - name: "Cheese and Jalapeño Mix"
    description: "Incorporate shredded cheddar cheese and diced jalapeños into the dough for a spicy and cheesy kick. This version is perfect for those who enjoy a little heat and rich cheese flavor in their bread."
\`\`\``;
