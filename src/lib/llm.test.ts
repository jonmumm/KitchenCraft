import * as yaml from "js-yaml";
import { expect, test } from "vitest";
import { sanitizeOutput } from "./llm";

const testInputs = [
  `recipe:
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
\`\`\``,
  `Example 1
\`\`\`yaml
suggestions:
  - name: Recipe Name 1
    description: Description of recipe 1.
  - name: Recipe Name 2
    description: Description of recipe 2.
\`\`\``,
  `:
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
    description: Breaded and baked cauliflower bites, perfect for dipping in your favorite sauce.`,
  `suggestions:
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
      description: A classic Italian dish made with fresh basil, garlic, Parmesan cheese, and pine nuts, blended into a smooth sauce and tossed with pasta.`,
];

test.each(testInputs)(
  "sanitizeOutput should correctly sanitize YAML strings",
  async (input) => {
    const sanitized = sanitizeOutput(input);
    yaml.load(sanitized);
  }
);
