export const FORMAT_INSTRUCTIONS = `Provide the recipe back in YAML format following the order keys in the below recipe yaml. Keys should be camelCase. Keep lists (e.g. ingredients, instructions) flat with no nesting.

\`\`\`yaml
recipe:
  yield: "String indicating how many servings or the quantity yielded"
  activeTime: "ISO 8601 duration format (e.g., PT15M for 15 minutes)"
  cookTime: "ISO 8601 duration format (e.g., PT1H for 1 hour)"
  totalTime: "ISO 8601 duration format (e.g., PT1H15M for 1 hour 15 minutes)"
  tags:
    - "Tag 1"
    - "Tag 2"
    - "... additional tags related to the recipe"
  ingredients:
    - "Ingredient 1 with quantity and description"
    - "Ingredient 2 with quantity and description"
    - "... additional ingredients"
  instructions:
    - "Step 1 of the cooking/preparation instructions"
    - "Step 2 of the cooking/preparation instructions"
    - "... additional steps"
\`\`\`
`;
