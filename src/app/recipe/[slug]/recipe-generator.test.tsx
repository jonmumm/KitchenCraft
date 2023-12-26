import { renderServerComponent } from "@/test/utils";
import { test } from "vitest";
import RecipeGenerator from "./recipe-generator";

const testInputs = [
  {
    type: "NEW_INSTANT_RECIPE",
    recipe: {
      name: "Caesar Salad",
      description:
        "A classic salad with romaine lettuce, croutons, parmesan cheese, and Caesar dressing.",
    },
    prompt: "Salad Recipes",
  },
  {
    type: "NEW_INSTANT_RECIPE",
    recipe: {
      name: "Beef Stroganoff",
      description:
        "A Russian dish of sautéed pieces of beef served in a sauce with smetana (sour cream).",
    },
    prompt: "Russian Main Courses",
  },
  {
    type: "NEW_INSTANT_RECIPE",
    recipe: {
      name: "Falafel Wrap",
      description:
        "Middle Eastern falafel balls wrapped in a flatbread with vegetables and tahini sauce.",
    },
    prompt: "Middle Eastern Street Food",
  },
  {
    type: "NEW_INSTANT_RECIPE",
    recipe: {
      name: "Pad Thai",
      description:
        "A stir-fried Thai noodle dish with shrimp, peanuts, scrambled egg, and bean sprouts.",
    },
    prompt: "Thai Noodle Dishes",
  },
  {
    type: "NEW_INSTANT_RECIPE",
    recipe: {
      name: "Ratatouille",
      description:
        "A French Provençal stewed vegetable dish, originating in Nice, and sometimes referred to as ratatouille niçoise.",
    },
    prompt: "French Vegetarian Dishes",
  },
  {
    type: "NEW_INSTANT_RECIPE",
    recipe: {
      name: "Chicken Tikka Masala",
      description:
        "Chunks of grilled chicken in a creamy tomato sauce, a dish of Indian origin.",
    },
    prompt: "Popular Indian Dishes",
  },
  {
    type: "NEW_INSTANT_RECIPE",
    recipe: {
      name: "Quiche Lorraine",
      description:
        "A French tart consisting of pastry crust filled with smoked bacon, cheese, and egg custard.",
    },
    prompt: "French Brunch Recipes",
  },
  {
    type: "NEW_INSTANT_RECIPE",
    recipe: {
      name: "Miso Soup",
      description:
        "A traditional Japanese soup consisting of a stock called dashi into which softened miso paste is mixed.",
    },
    prompt: "Japanese Soup Recipes",
  },
  {
    type: "NEW_INSTANT_RECIPE",
    recipe: {
      name: "Moussaka",
      description:
        "A Greek eggplant or potato-based dish, often including ground meat, layered with eggplant or potatoes and topped with a béchamel sauce.",
    },
    prompt: "Greek Casserole Dishes",
  },
  {
    type: "NEW_INSTANT_RECIPE",
    recipe: {
      name: "Feijoada",
      description:
        "A Brazilian stew of black beans with beef and pork, a typical dish in Brazil.",
    },
    prompt: "Brazilian Traditional Dishes",
  },
  {
    type: "NEW_INSTANT_RECIPE",
    recipe: {
      name: "Chocolate Milkshake",
      description:
        "A rich and creamy beverage made with chocolate ice cream, milk, and chocolate syrup, often topped with whipped cream.",
    },
    prompt: "Sweet Beverages",
  },
  {
    type: "NEW_INSTANT_RECIPE",
    recipe: {
      name: "Tiramisu",
      description:
        "A classic Italian dessert made with layers of coffee-soaked ladyfingers and rich mascarpone cheese.",
    },
    prompt: "Italian Desserts",
  },
  {
    type: "NEW_INSTANT_RECIPE",
    recipe: {
      name: "Butter Chicken",
      description:
        "A creamy tomato-based curry with tender pieces of chicken, flavored with Indian spices.",
    },
    prompt: "Indian Curries",
  },
  {
    type: "NEW_INSTANT_RECIPE",
    recipe: {
      name: "Goulash",
      description:
        "A Hungarian stew of meat and vegetables, seasoned with paprika and other spices.",
    },
    prompt: "Hungarian Dishes",
  },
  {
    type: "NEW_INSTANT_RECIPE",
    recipe: {
      name: "Fish Tacos",
      description:
        "Grilled or fried fish served in a tortilla, often with slaw, salsa, and a creamy sauce.",
    },
    prompt: "Mexican Dishes",
  },
  {
    type: "NEW_INSTANT_RECIPE",
    recipe: {
      name: "Spring Rolls",
      description:
        "Crispy rolls filled with vegetables and sometimes shrimp or pork, served with dipping sauce.",
    },
    prompt: "Chinese Appetizers",
  },
  {
    type: "NEW_INSTANT_RECIPE",
    recipe: {
      name: "Creamy Avocado Pasta",
      description:
        "Rich avocado sauce with al dente noodles; vegan comfort food.",
    },
    prompt: "Recipes with Avocados",
  },
  {
    type: "NEW_INSTANT_RECIPE",
    recipe: {
      name: "Sushi",
      description:
        "A Japanese dish of prepared vinegared rice, usually with some sugar and salt, accompanying a variety of ingredients, such as seafood, vegetables, and occasionally tropical fruits.",
    },
    prompt: "Japanese Dishes",
  },
  {
    type: "NEW_INSTANT_RECIPE",
    recipe: {
      name: "Croissant",
      description:
        "A buttery, flaky pastry; perfect for breakfast with coffee.",
    },
    prompt: "French Breakfast Items",
  },
  {
    type: "NEW_INSTANT_RECIPE",
    recipe: {
      name: "Empanada",
      description:
        "A baked or fried turnover consisting of pastry and filling, common in Latin American and Filipino cultures.",
    },
    prompt: "Latin American Dishes",
  },
  {
    type: "NEW_INSTANT_RECIPE",
    recipe: {
      name: "Pancakes",
      description: "Fluffy, round cakes prepared from a starch-based batter.",
    },
    prompt: "Breakfast Dishes",
  },
  {
    type: "NEW_INSTANT_RECIPE",
    recipe: {
      name: "Chili Con Carne",
      description:
        "A spicy stew containing chili peppers, meat, and often tomatoes and beans.",
    },
    prompt: "Tex-Mex Dishes",
  },
  {
    type: "NEW_INSTANT_RECIPE",
    recipe: {
      name: "Pizza Margherita",
      description:
        "A type of pizza made with tomatoes, mozzarella cheese, fresh basil, salt, and extra-virgin olive oil.",
    },
    prompt: "Italian Dishes",
  },
  {
    type: "NEW_INSTANT_RECIPE",
    recipe: {
      name: "Baklava",
      description:
        "A rich, sweet dessert pastry made of layers of filo filled with chopped nuts, sweetened and held together with syrup or honey.",
    },
    prompt: "Middle Eastern Desserts",
  },
  {
    type: "NEW_INSTANT_RECIPE",
    recipe: {
      name: "Lobster Bisque",
      description:
        "A smooth, creamy, highly seasoned soup based on lobster broth.",
    },
    prompt: "Seafood Dishes",
  },
  {
    type: "NEW_INSTANT_RECIPE",
    recipe: {
      name: "Bobotie",
      description:
        "A South African dish consisting of spiced minced meat baked with an egg-based topping.",
    },
    prompt: "South African Dishes",
  },
  {
    type: "NEW_INSTANT_RECIPE",
    recipe: {
      name: "Borscht",
      description:
        "A sour soup commonly consumed in Eastern Europe, made with beetroot as the main ingredient.",
    },
    prompt: "Eastern European Dishes",
  },
  {
    type: "NEW_INSTANT_RECIPE",
    recipe: {
      name: "Tom Yum Soup",
      description: "A hot and sour Thai soup, usually cooked with shrimp.",
    },
    prompt: "Thai Dishes",
  },
];

for (const input of testInputs) {
  test(`RecipeGenerator: ${input.recipe.name}`, async () => {
    const testPromise = new Promise<void>(async (resolve, reject) => {
      const jsx = await RecipeGenerator({
        input,
        onError(error, outputRaw) {
          console.error("failed with error", error);
          console.error("Output:");
          console.error(outputRaw);
          reject(error);
        },
        onComplete(output) {
          resolve();
        },
      });

      renderServerComponent(jsx);
    });

    await testPromise;
  });
}
