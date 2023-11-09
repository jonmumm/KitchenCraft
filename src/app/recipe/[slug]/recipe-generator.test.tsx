import { renderServerComponent } from "@/test/utils";
import { test } from "vitest";
import RecipeGenerator from "./recipe-generator";

const testRecipes = [
  {
    name: "Tiramisu",
    description:
      "A classic Italian dessert made with layers of coffee-soaked ladyfingers and rich mascarpone cheese.",
    suggestionsInput: {
      prompt: "Italian Desserts",
      tags: [],
      ingredients: [],
    },
    suggestionsOutputRaw: `- name: Tiramisu
      description: A classic Italian dessert...
    - name: Cannoli
      description: Crispy pastry tubes filled with sweet ricotta cheese.
    - name: Panna Cotta
      description: Silky, creamy dessert often topped with berry sauce or caramel.
    - name: Gelato
      description: Rich and creamy Italian ice cream with various flavors.
    - name: Zabaglione
      description: A light custard made with egg yolks, sugar, and Marsala wine.`,
  },
  {
    name: "Butter Chicken",
    description:
      "A creamy tomato-based curry with tender pieces of chicken, flavored with Indian spices.",
    suggestionsInput: {
      prompt: "Indian Curries",
      tags: [],
      ingredients: [],
    },
    suggestionsOutputRaw: `- name: Butter Chicken
      description: A creamy tomato-based curry...
    - name: Rogan Josh
      description: A flavorful lamb curry with a mix of aromatic spices.
    - name: Saag Paneer
      description: Soft paneer cubes in a spinach-based gravy.
    - name: Chicken Tikka Masala
      description: Grilled chicken pieces in a creamy tomato sauce.
    - name: Chana Masala
      description: Spiced chickpea curry, great with rice or bread.`,
  },
  {
    name: "Goulash",
    description:
      "A Hungarian stew of meat and vegetables, seasoned with paprika and other spices.",
    suggestionsInput: {
      prompt: "Hungarian Dishes",
      tags: [],
      ingredients: [],
    },
    suggestionsOutputRaw: `- name: Goulash
      description: A Hungarian stew of meat...
    - name: Chimney Cake
      description: Sweet spiral-shaped pastry baked over an open fire.
    - name: Pörkölt
      description: A meat stew similar to goulash but without vegetables.
    - name: Meggyleves
      description: Chilled sour cherry soup, often served as a starter.
    - name: Hortobágyi Pancakes
      description: Crepes filled with meat and served with paprika sauce.`,
  },
  {
    name: "Fish Tacos",
    description:
      "Grilled or fried fish served in a tortilla, often with slaw, salsa, and a creamy sauce.",
    suggestionsInput: {
      prompt: "Mexian dishes",
      tags: [],
      ingredients: [],
    },
    suggestionsOutputRaw: `- name: Fish Tacos
      description: Grilled or fried fish served in a tortilla...
    - name: Enchiladas
      description: Tortillas rolled around a filling, covered with chili pepper sauce.
    - name: Chiles Rellenos
      description: Poblano peppers stuffed with cheese or meat.
    - name: Tamales
      description: Steamed dough filled with meats, cheeses, fruits, or chilies.
    - name: Guacamole
      description: A dip made from mashed avocado mixed with tomatoes, onions, and lime.`,
  },
  {
    name: "Spring Rolls",
    description:
      "Crispy rolls filled with vegetables and sometimes shrimp or pork, served with dipping sauce.",
    suggestionsInput: {
      prompt: "Chinese appetizers",
      tags: [],
      ingredients: [],
    },
    suggestionsOutputRaw: `- name: Spring Rolls
      description: Crispy rolls filled with vegetables...
    - name: Dumplings
      description: Dough pockets filled with meat, seafood, or vegetables.
    - name: Peking Duck
      description: Roasted duck with crispy skin, served with pancakes.
    - name: Baozi
      description: Steamed buns filled with various ingredients.
    - name: Hot and Sour Soup
      description: A tangy and spicy soup with tofu, wood ear mushrooms, and bamboo shoots.`,
  },
  {
    name: "Creamy Avocado Pasta",
    description:
      "Rich avocado sauce with al dente noodles; vegan comfort food.",
    suggestionsInput: {
      prompt: "Recipes with Avocados",
      tags: [],
      ingredients: [],
    },
    suggestionsOutputRaw: `- name: Creamy Avocado Pasta
      description: Rich avocado sauce with al dente noodles; vegan comfort food.
    - name: Avocado Chocolate Mousse
      description: Silky, rich dessert; avocados' natural creaminess meets cocoa delight.
    - name: Avocado Breakfast Toast
      description: Crispy bread topped with mashed avocado, sprinkled with seeds.
    - name: Chilled Avocado Soup
      description: Refreshing, smooth soup, perfect for summer; hint of lime.
    - name: Stuffed Avocado Boats
      description: Avocado halves filled with tuna or chicken salad mix.
    - name: Avocado Ice Cream
      description: Creamy, dairy-free treat with a touch of natural sweetness.`,
  },
  {
    name: "Sushi",
    description:
      "A Japanese dish of prepared vinegared rice, usually with some sugar and salt, accompanying a variety of ingredients, such as seafood, vegetables, and occasionally tropical fruits.",
    suggestionsInput: {
      prompt: "Japanese Dishes",
      tags: [],
      ingredients: [],
    },
    suggestionsOutputRaw: `- name: Sushi
      description: A Japanese dish of prepared vinegared rice...
    - name: Tempura
      description: Lightly battered and deep-fried seafood and vegetables.
    ...`, // and so on
  },
  {
    name: "Croissant",
    description: "A buttery, flaky pastry; perfect for breakfast with coffee.",
    suggestionsInput: {
      prompt: "French Breakfast Items",
      tags: [],
      ingredients: [],
    },
    suggestionsOutputRaw: `- name: Croissant
      description: A buttery, flaky pastry...
    - name: Quiche
      description: Savory tart filled with eggs, cream, and cheese.
    ...`, // and so on
  },
  {
    name: "Empanada",
    description:
      "A baked or fried turnover consisting of pastry and filling, common in Latin American and Filipino cultures.",
    suggestionsInput: {
      prompt: "Chilean dishes",
      tags: [],
      ingredients: [],
    },
    suggestionsOutputRaw: `- name: Empanada
      description: A baked or fried turnover...
    - name: Cazuela
      description: A hearty stew with meat and vegetables.
    ...`, // and so on
  },
  {
    name: "Pancakes",
    description: "Fluffy, round cakes prepared from a starch-based batter.",
    suggestionsInput: {
      prompt: "Breakfast dishes",
      tags: [],
      ingredients: [],
    },
    suggestionsOutputRaw: `- name: Pancakes
      description: Fluffy, round cakes...
    - name: Waffles
      description: Grid patterned cakes cooked between two hot plates.
    ...`, // and so on
  },
  {
    name: "Chili Con Carne",
    description:
      "A spicy stew containing chili peppers, meat, and often tomatoes and beans.",
    suggestionsInput: {
      prompt: "Tex-mex dishes",
      tags: [],
      ingredients: [],
    },
    suggestionsOutputRaw: `- name: Chili Con Carne
      description: A spicy stew containing chili peppers...
    - name: Tacos
      description: Folded or rolled tortilla filled with various mixtures, such as seasoned meat, beans, and cheese.
    - name: Quesadilla
      description: Tortilla filled with cheese and heated.
    - name: Enchiladas
      description: Corn tortillas rolled around a filling and covered with chili pepper sauce.
    - name: Burritos
      description: Large flour tortilla filled with meat, beans, and cheese, then rolled up.`,
  },
  {
    name: "Pizza Margherita",
    description:
      "A type of pizza made with tomatoes, mozzarella cheese, fresh basil, salt, and extra-virgin olive oil.",
    suggestionsInput: {
      prompt: "Italian dishes",
      tags: [],
      ingredients: [],
    },
    suggestionsOutputRaw: `- name: Pizza Margherita
      description: A type of pizza made with tomatoes...
    - name: Spaghetti Carbonara
      description: Pasta dish with eggs, cheese (Pecorino Romano), pancetta, and black pepper.
    - name: Risotto
      description: Creamy rice dish cooked with broth and flavored with parmesan cheese and other ingredients.
    - name: Lasagna
      description: Layered pasta dish with meat, cheese, and tomato sauce.
    - name: Tiramisu
      description: Coffee-flavored Italian dessert made of ladyfingers dipped in coffee, layered with mascarpone cheese, and flavored with cocoa.`,
  },
  {
    name: "Baklava",
    description:
      "A rich, sweet dessert pastry made of layers of filo filled with chopped nuts, sweetened and held together with syrup or honey.",
    suggestionsInput: {
      prompt: "Middle Eastern desserts",
      tags: [],
      ingredients: [],
    },
    suggestionsOutputRaw: `- name: Baklava
      description: A rich, sweet dessert pastry...
    - name: Kunafa
      description: A dessert made with thin noodle-like pastry soaked in syrup.
    - name: Halva
      description: A sweet, dense confection made from tahini or semolina.
    - name: Ma'amoul
      description: Shortbread pastry filled with dates or nuts.
    - name: Umm Ali
      description: Egyptian bread pudding with nuts and sweetened milk.`,
  },
  {
    name: "Lobster Bisque",
    description:
      "A smooth, creamy, highly seasoned soup based on lobster broth.",
    suggestionsInput: {
      prompt: "Seafood dishes",
      tags: [],
      ingredients: [],
    },
    suggestionsOutputRaw: `- name: Lobster Bisque
      description: A smooth, creamy soup...
    - name: Paella
      description: A Spanish rice dish with various types of seafood.
    - name: Fish and Chips
      description: Fried fish fillet served with crispy fries.
    - name: Clam Chowder
      description: A rich soup containing clams, onions, and potatoes.
    - name: Grilled Calamari
      description: Grilled squid rings, often served with a lemon wedge.`,
  },
  {
    name: "Bobotie",
    description:
      "A South African dish consisting of spiced minced meat baked with an egg-based topping.",
    suggestionsInput: {
      prompt: "South African dishes",
      tags: [],
      ingredients: [],
    },
    suggestionsOutputRaw: `- name: Bobotie
      description: A South African dish with spiced minced meat...
    - name: Biltong
      description: Cured and dried meat, similar to jerky.
    - name: Bunny Chow
      description: A hollowed-out loaf of bread filled with curry.
    - name: Melktert
      description: A custard pie with a cinnamon-infused crust.
    - name: Koeksister
      description: A sweet, braided pastry deep-fried and soaked in syrup.`,
  },
  {
    name: "Borscht",
    description:
      "A sour soup commonly consumed in Eastern Europe, made with beetroot as the main ingredient.",
    suggestionsInput: {
      prompt: "Eastern European dishes",
      tags: [],
      ingredients: [],
    },
    suggestionsOutputRaw: `- name: Borscht
      description: A sour soup made with beetroot...
    - name: Pierogi
      description: Dumplings filled with a variety of ingredients such as potato, cheese, or meat.
    - name: Kielbasa
      description: Polish smoked sausage made from seasoned pork.
    - name: Holubtsi
      description: Ukrainian stuffed cabbage rolls with meat and rice.
    - name: Pelmeni
      description: Russian meat-filled dumplings.`,
  },
  {
    name: "Tom Yum Soup",
    description: "A hot and sour Thai soup, usually cooked with shrimp.",
    suggestionsInput: {
      prompt: "Thai dishes",
      tags: [],
      ingredients: [],
    },
    suggestionsOutputRaw: `- name: Tom Yum Soup
      description: A hot and sour Thai soup...
    - name: Pad Thai
      description: Stir-fried rice noodle dish with shrimp, tofu, or chicken.
    - name: Green Curry
      description: A creamy, aromatic curry with meat, eggplants, and basil.
    - name: Som Tum
      description: Green papaya salad with chilies, lime, and dried shrimp.
    - name: Mango Sticky Rice
      description: Sweet glutinous rice served with fresh mango slices and coconut milk.`,
  },
];

for (const recipe of testRecipes) {
  test(`RecipeGenerator: ${recipe.name}`, async () => {
    const testPromise = new Promise<void>(async (resolve, reject) => {
      const input = {
        type: "NEW_RECIPE" as const,
        recipe: {
          name: recipe.name,
          description: recipe.description,
        },
        suggestionsInput: recipe.suggestionsInput,
        suggestionsOutputRaw: recipe.suggestionsOutputRaw,
      };

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
