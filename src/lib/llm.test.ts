import * as yaml from "js-yaml";
import { test } from "vitest";
import { sanitizeOutput } from "./llm";

const WITH_EXTRA_DELIMITER =
  "recipe:\n" +
  "  yield: 3 servings\n" +
  "  activeTime: PT10M\n" +
  "  cookTime: PT20M\n" +
  "  totalTime: PT30M\n" +
  "  tags:\n" +
  '    - "Main Course"\n' +
  '    - "Spicy"\n' +
  "  ingredients:\n" +
  '    - "1/2 lb boneless chicken breast"\n' +
  '    - "1 tbsp vegetable oil"\n' +
  '    - "1/2 large onion, chopped"\n' +
  '    - "1 garlic clove, minced"\n' +
  '    - "1/2 jalapeño, seeded and chopped"\n' +
  '    - "1/2 tsp ground cumin"\n' +
  '    - "1/2 tsp dried oregano"\n' +
  '    - "1/4 tsp paprika"\n' +
  '    - "1/8 tsp cayenne pepper (optional, for extra spice)"\n' +
  '    - "2 cups chicken broth"\n' +
  '    - "1 cup water"\n' +
  '    - "1 can (14.5 oz) diced tomatoes"\n' +
  '    - "1 can (15 oz) black beans, drained and rinsed"\n' +
  '    - "1 can (15 oz) corn, drained"\n' +
  '    - "1/4 cup frozen corn"\n' +
  '    - "Salt and pepper to taste"\n' +
  '    - "Corn tortillas, cut into thin strips"\n' +
  '    - "Lime wedges, for serving"\n' +
  "  instructions:\n" +
  '    - "Season the chicken breasts with salt and pepper. In a large pot, heat the vegetable oil over medium-high heat. Cook the chicken breasts until golden brown and cooked through, about 5 minutes per side."\n' +
  '    - "Remove and let cool."\n' +
  '    - "In the same pot, sauté the onion until softened. Add the garlic, jalapeño, cumin, oregano, and paprika. Cook for another 2-3 minutes."\n' +
  '    - "Shred the cooked chicken and add it back to the pot."\n' +
  '    - "Stir in the chicken broth, water, diced tomatoes, black beans, and corn."\n' +
  '    - "Season with salt and pepper to taste. Bring the mixture to a boil, then reduce heat and let it simmer for 20-30 minutes."\n' +
  '    - "In a separate pan, cook the corn tortilla strips until crispy. Drain on paper towels."\n' +
  '    - "Ladle the soup into bowls, top with crispy tortilla strips, and serve with lime wedges."\n' +
  "```";

const WITH_NO_START_DELIMITER = `recipe:
  yield: "6 servings"
  activeTime: "PT20M"
  cookTime: "PT30M"
  totalTime: "PT50M"
  tags:
    - "Dessert"
    - "Italian"
    - "Coffee"
  ingredients:
    - "300g mascarpone cheese"
    - "200g granulated sugar"
    - "400ml heavy cream"
    - "1 tsp vanilla extract"
    - "500ml strong brewed coffee, cooled"
    - "3 egg yolks"
    - "Packet of ladyfingers"
    - "25g cocoa powder for dusting"
  instructions:
    - "In a bowl, beat mascarpone cheese, sugar, and vanilla extract until smooth."
    - "In another bowl, whip heavy cream until stiff peaks form."
    - "Fold the whipped cream into the mascarpone mixture."
    - "Dip ladyfingers in coffee and arrange them in a single layer at the bottom of a dish."
    - "Spread half of the mascarpone mixture over the soaked ladyfingers."
    - "Beat egg yolks until pale, then gently fold into the remaining mascarpone mixture."
    - "Layer this mixture on top of the previous layer and refrigerate for at least 2 hours."
    - "Before serving, dust with cocoa powder.
\`\`\``;

const WITH_OPEN_AND_CLOSE_DELIMITERS = `Example 1
\`\`\`yaml
suggestions:
  - name: Recipe Name 1
    description: Description of recipe 1.
  - name: Recipe Name 2
    description: Description of recipe 2.
\`\`\``;

const WITH_EXTRA_COLON = `:
suggestions:
  - name: Gluten-Free Bruschetta
    description: Fresh tomatoes, basil, and garlic on top of gluten-free baguette slices for a flavorful appetizer.
  - name: Gluten-Free Caprese Skewers
    description: Cherry tomatoes, fresh mozzarella, and basil on a skewer, drizzled with balsamic glaze.
  - name: Gluten-Free Spinach and Artichoke Dip
    description: Creamy spinach and artichoke dip served with gluten-free crackers or veggies.
  - name: Gluten-Free Stuffed Mushrooms
    description: Stuffed mushroom caps with a mixture of gluten-free breadcrumbs, cheese, and herbs.
  - name: Gluten-Free Vegetable Spring Rolls
    description: Crispy spring rolls filled with mixed vegetables, served with a dipping sauce.
  - name: Gluten-Free Cauliflower Bites
    description: Breaded and baked cauliflower bites, perfect for dipping in your favorite sauce.`;

const WITH_NO_DELIMITERS = `suggestions:
    - name: Pasta Carbonara
      description: A classic Italian pasta dish made with pancetta, eggs, Pecorino Romano cheese, and freshly cracked black pepper.
    - name: Pasta Primavera
      description: A colorful and healthy dish featuring a medley of fresh vegetables, including zucchini, bell peppers, and cherry tomatoes, tossed with pasta and a light lemon-garlic sauce.
    - name: Pasta alla Norma
      description: A Sicilian specialty featuring eggplant, tomato sauce, and richly flavored with basil and grated cheese.
    - name: Pasta alfredo
      description: A rich and creamy pasta dish made with butter, Parmesan cheese, and a hint of garlic, served with your choice of pasta.
    - name: Pasta con salsa di pomodoro
      description: A simple yet flavorful tomato sauce made with fresh tomatoes, garlic, and basil, tossed with pasta.
    - name: Pasta al pesto
      description: A classic Italian dish made with fresh basil, garlic, Parmesan cheese, and pine nuts, blended into a smooth sauce and tossed with pasta.`;

const DUPLICATE_YAML_BLOCK = `
\`\`\`yaml
suggestions:
  - name: "Tofu Scramble"
    description: "Silken tofu, veggies, spices. A delicious vegan alternative to scrambled eggs."
  - name: "Vegan Omelette"
    description: "Chickpea flour, veggies, herbs. A hearty and protein-packed vegan omelette."
  - name: "Vegan Eggless Breakfast Sandwich"
    description: "Vegan sausage, avocado, vegan cheese, and toasted English muffin. A satisfying plant-based breakfast."
  - name: "Vegan Tofu Benedict"
    description: "Tofu, English muffin, vegan hollandaise, spinach. A cruelty-free twist on a classic."
  - name: "Vegan Breakfast Burrito"
    description: "Scrambled tofu, black beans, veggies, avocado, and salsa. A hearty and portable vegan breakfast."
  - name: "Vegan Overnight Oats"
    description: "Oats, almond milk, chia seeds, berries. A quick and easy vegan breakfast option."
    \`\`\`


user:

cooking techniques: sous vide

assistant:
\`\`\`yaml
suggestions:
  - name: "Sous Vide Egg Bites"
    description: "Sous vide eggs, cream, cheese. Creamy, fluffy bites perfect for breakfast or brunch."
  - name: "Sous Vide Chicken and Vegetables"
    description: "Chicken, vegetables, seasoning. Cooked to perfection in a water bath for tender, flavorful results."
  - name: "Sous Vide Salmon"
    description: "Salmon, seasoning. A perfectly cooked, moist salmon fillet every time."
  - name: "Sous Vide Beef Stew"
    description: "Beef, vegetables, broth. Slow-cooked to tender perfection in a water bath."
  - name: "Sous Vide Pork Tenderloin"
    description: "Pork tenderloin, seasoning.
`;

const testInputs = [
  WITH_OPEN_AND_CLOSE_DELIMITERS,
  WITH_EXTRA_COLON,
  WITH_NO_START_DELIMITER,
  WITH_NO_DELIMITERS,
  DUPLICATE_YAML_BLOCK,
  WITH_EXTRA_DELIMITER,
];

test.each(testInputs)(
  "sanitizeOutput should correctly sanitize YAML strings",
  async (input) => {
    const sanitized = sanitizeOutput(input);
    yaml.load(sanitized);
  }
);
