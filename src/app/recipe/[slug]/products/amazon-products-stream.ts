import { TokenStream } from "@/lib/token-stream";
import { AmazonProductsPredictionInput } from "@/types";
import { PromptTemplate } from "langchain/prompts";

export class AmazonProductsTokenStream extends TokenStream<AmazonProductsPredictionInput> {
  protected async getUserMessage(
    input: AmazonProductsPredictionInput
  ): Promise<string> {
    return await userMessageTemplate.format({
      googleSearchText: input.googleSearchText,
      recipeName: input.recipe.name,
      recipeDescription: input.recipe.description,
      recipeTags: Array.isArray(input.recipe.tags)
        ? input.recipe.tags.join("\n")
        : "",
      recipeIngredients: Array.isArray(input.recipe.ingredients)
        ? input.recipe.ingredients.join("\n")
        : "",
      recipeInstructions: Array.isArray(input.recipe.instructions)
        ? input.recipe.instructions.join("\n")
        : "",
    });
  }

  protected async getSystemMessage(
    input: AmazonProductsPredictionInput
  ): Promise<string> {
    let template = "";

    if (input.type === "book") {
      template = bookTemplate;
    } else if (input.type === "equipment") {
      template = equipmentTemplate;
    } else if (input.type === "ingredient") {
      template = ingredientTemplate;
    }

    return template;
  }
}

const userMessageTemplate = PromptTemplate.fromTemplate(`
\`\`\`yaml
recipe:
  name: {recipeName}
  description: {recipeDescription}
  tags: {recipeTags}
  ingredients: {recipeIngredients}
  instructions: {recipeInstructions}
\`\`\`

\`\`\`json
{googleSearchText}
\`\`\`
`);

const bookTemplate = `The user has provided a recipe and a list of Amazon product pages. Select 10 books from Amazon list that are relevant to this recipe sorting by how relevant to this particular recipe.

Format the response in a yaml block with "products" as the root level key for the list, with each book having a name and ASIN (Amazon Standard Identificaiton Number)

Ensure titles have quotes around them so yaml parsing will not fail. Do not include ... or Amazon in the name string.

Important: ensure the returned list has unique ASINs. Do not return the same product ASIN twice.

Here is an example response for a Tomato Soup Recipe:

\`\`\`yaml
products:
  - name: "The Culinary Chronicles"
    asin: "ABC123XYZ"
  - name: "Epicurean Explorations: A Gastronomic Journey"
    asin: "DEF456UVW"
  - name: "Flavors Unleashed: A Culinary Creativity Guide"
    asin: "GHI789STU"
  - name: "Savoring Seasonings: A Chef's Guide to Taste Mastery"
    asin: "JKL012VWX"
  - name: "The Culinary Scientist: Unraveling the Secrets of Cooking"
    asin: "MNO345YZ"
  - name: "Hearty Soups and Savory Stews: A Culinary Adventure"
    asin: "PQR678ABC"
  - name: "The Tomato Odyssey: From Garden to Gourmet"
    asin: "STU901DEF"
  - name: "Comforting Bowls: A Treasury of Soup and Stew Recipes"
    asin: "VWX234GHI"
\`\`\`

Results should be varied. Use the name provided by the user in the json, but fix spelling mixtakes and clean up any extra irrelevant characters any important details a buyer might want in the name. Parse the ASIN from the url. Do not include any books from the yaml example (those names and ASINs are made up).`;

const equipmentTemplate = `The user has provided a recipe and a list of Amazon product pages. Select 10 kitchen tools, equipment, gear, or gadgets from that Amazon list that are relavant to this recipe, sorting by the most relevant to this specific recipe.

Format the response in a yaml block with "products" as the root level key for the list, with each item having a name and the ASIN (Amazon Standard Identification Number).

Ensure titles have quotes around them so yaml parsing will not fail. Do not include ... or Amazon in the name string.

Important: ensure the returned list has unique ASINs. Do not return the same product ASIN twice.

Here is an example response for a Tomato Soup Recipe:

\`\`\`yaml
products:
  - name: "KitchenEra Immersion Blender"
    asin: "ABC123XYZ"
  - name: "CookMaster Soup Pot and Ladle Set"
    asin: "DEF456UVW"
  - name: "ChefPro Soup Strainer and Skimmer"
    asin: "GHI789STU"
  - name: "GourmetChef Chef's Knife"
    asin: "JKL012VWX"
  - name: "ServingDeluxe Soup Tureen"
    asin: "MNO345YZ"
  - name: "Non-Stick MasterFry Frying Pan"
    asin: "PQR678ABC"
  - name: "MeasurEase Measuring Cups and Spoons"
    asin: "STU901DEF"
  - name: "Baker'sChoice Baking Sheet and Rack Set"
    asin: "VWX234GHI"
\`\`\`

Results should be varied. Use the name provided by the user in the json, but fix spelling mistakes and clean up any extra irrelevant characters any important details a buyer might want in the name. Parse the ASIN from the url. Do not include any products from the yaml example (thoes product names and ASINs are made up for illustration purposes).`;

const ingredientTemplate = `The user has provided a JSON list of google search results for Amazon products. From that list, select a subset 10 products relevant to the recipe.

Format the response in a yaml block with "products" as the root level key for the list, with each item having a name and the ASIN (Amazon Standard Identification Number).

Ensure titles have quotes around them so yaml parsing will not fail. Do not include ... or Amazon in the name string.

Important: ensure the returned list has unique ASINs. Do not return the same product ASIN twice.

Include variety, do not have all of the same ingredient even if it's the most important ingredient.

Here is an example response for a Tomato Soup Recipe:

\`\`\`yaml
products:
  - name: "Hunt's Canned Tomatoes"
    asin: "ABC123XYZ"
  - name: "McCormick Onions and Garlic"
    asin: "DEF456UVW"
  - name: "Muir Glen Fire Roasted San Marzano Tomatoes"
    asin: "GHI789STU"
  - name: "Swanson Chicken or Vegetable Broth"
    asin: "JKL012VWX"
  - name: "McCormick Basil and Oregano"
    asin: "MNO345YZ"
  - name: "Kraft Parmesan Cheese"
    asin: "PQR678ABC"
  - name: "Barilla Pasta"
    asin: "STU901DEF"
  - name: "Heinz Ketchup"
    asin: "VWX234GHI"
\`\`\`

Results should be varied (do not include two very similar results, i.e. 2 variations of the same brand of yeast). Only include ingredients and "consumable things", not equipment or tools (e.g. pans, blenders).

Use the name provided by the user in the json, but fix spelling mistakes and clean up any extra irrelevant characters any important details a buyer might want in the name. Parse the ASIN from the url. Do not include any products from the yaml example (thoes ASINs are made up).`;
