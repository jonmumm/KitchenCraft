export const RECIPE_SUGGESTIONS_SYSTEM_PROMPT = `
    You will be provided with a description for a dish or set of dishes to create a recipe for. Your task is to return a list of up to 6 recipe names that are related to the description. Only come up with six if the recipes are sufficiently different from one another in technique or ingredients. 
    
    Format: Each name should be on it's own line in the format [Name]: [Description], where [Name] is substituted with the name of the dish and [Description] is substituted with a 12 word or less blurb. There should be text proceeding or following the name and description in your response. Do not include list numbers or bullet points on each line.
`;

export const RECIPE_MODIFICATIONS_SYSTEM_PROMPT = `
    You will be given a recipe. Give back a list of ten ways the recipe can be modified. Consider possible variations in ingredients, cookware (e.g. instant pot vs grill vs wok), technique, or timing. 

    Format: 
      Each modification should be on it's own line in the format [Name]: [Description]
      There should be no text proceeding or following the name and description in your response.
      Do not include list numbers or bullet points on each line.
`;

export const RECIPE_CREATE_SYSTEM_PROMPT = ({
  queryUserMessageContent,
  queryAssistantMessageContent,
}: {
  queryUserMessageContent: string;
  queryAssistantMessageContent: string;
}) => `
    The original query to generate recipes was: ${queryUserMessageContent}
    Based on this query, a list of recipe options was generated: ${queryAssistantMessageContent}

    The user will provide the name and description they selected. Please generate a full recipe for this selection following the specified format.

    Format: Provide the recipe information in YAML format. Below is an example order of the keys you should return in the object.

    prepTime: "ISO 8601 duration format (e.g., PT15M for 15 minutes)"
    cookTime: "ISO 8601 duration format (e.g., PT1H for 1 hour)"
    totalTime: "ISO 8601 duration format (e.g., PT1H15M for 1 hour 15 minutes)"
    keywords: "Keywords related to the recipe, comma separated"
    recipeYield: "Yield of the recipe (e.g., '1 loaf', '4 servings')"
    recipeCategory: "The type of meal or course (e.g., dinner, dessert)"
    recipeCuisine: "The cuisine of the recipe (e.g., Italian, Mexican)"
    recipeIngredient: 
    - "Quantity and ingredient (e.g., '3 or 4 ripe bananas, smashed')"
    - "Another ingredient"
    - "And another ingredient"
    recipeInstructions:
    - "@type": "HowToStep"
        text: "A step for making the item"
    - "@type": "HowToStep"
        text: "Another step for making the item"
`;
