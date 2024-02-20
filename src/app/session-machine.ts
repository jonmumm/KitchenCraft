import {
  StreamObservableEvent,
  streamToObservable,
} from "@/lib/stream-to-observable";
import { appendValueWithComma } from "@/lib/string";
import { TokenStream } from "@/lib/token-stream";
import {
  InstantRecipeMetadataPredictionOutputSchema,
  SuggestionPredictionOutputSchema,
} from "@/schema";
import { AppEvent } from "@/types";
import { from, switchMap } from "rxjs";
import { assign, fromEventObservable, setup } from "xstate";
import { z } from "zod";

const autoSuggestionOutputSchemas = {
  tags: InstantRecipeMetadataPredictionOutputSchema,
  ingredients: InstantRecipeMetadataPredictionOutputSchema,
  recipes: SuggestionPredictionOutputSchema,
};

// type AutoSuggestionOutput =
//   | {
//       type: "tags";
//       payload: z.infer<typeof InstantRecipeMetadataPredictionOutputSchema>;
//     }
//   | {
//       type: "ingredients";
//       payload: z.infer<typeof InstantRecipeMetadataPredictionOutputSchema>;
//     }
//   | {
//       type: "recipes";
//       payload: z.infer<typeof InstantRecipeMetadataPredictionOutputSchema>;
//     };

const InputSchema = z.object({
  id: z.string(),
});
type Input = z.infer<typeof InputSchema>;

// const autoSuggestMachine = setup({
//   types: {
//     events: {} as AppEvent | { type: "START" },
//     input: {} as {
//       prompt: string;
//       type: "tags" | "ingredients" | "recipes";
//     },
//     context: {} as {
//       prompt: string;
//     },
//   },
// }).createMachine({
//   id: "autoSuggestMachine",
//   initial: "Idle",
//   context: {
//     prompt: "",
//   },
//   on: {
//     ADD_INGREDIENT: ".Generating",
//     ADD_TAG: ".Generating",
//     SET_INPUT: {
//       target: ".Holding",
//       actions: ({ event }) => {
//         console.log("SI", event);
//       },
//       guard: ({ context, event }) => !!event.value?.length,
//     },
//   },
//   states: {
//     Idle: {},
//     Holding: {
//       after: {
//         500: "Generating",
//       },
//     },
//     Generating: {
//       invoke: {
//         input: ({ context }) => ({ prompt: context.prompt }),
//         src: fromPromise(async ({ input }: { input: { prompt: string } }) => {
//           // get the right stream...
//           const tokenStream = new InstantRecipeMetadataStream();
//           const stream = await tokenStream.getStream({ prompt: input.prompt });
//           const parser = new TokenParser(
//             InstantRecipeMetadataPredictionOutputSchema
//           );
//           const charArray: string[] = [];
//           for await (const chunk of stream) {
//             for (const char of chunk) {
//               charArray.push(char);
//             }
//             // TODO try parse
//             const outputRaw = charArray.join("");
//             const outputSanitized = sanitizeOutput(outputRaw);
//             const outputYaml = jsYaml.load(outputSanitized);
//             // const outputParse = partialSchema.safeParse(outputYaml);
//             // if (outputParse.success) {
//             //   subject.next({
//             //     type: `${eventType}_PROGRESS`,
//             //     data: outputParse.data as TPartialOutput,
//             //   });
//             // }
//           }
//         }),
//       },
//     },
//   },
// });

const autoSuggestIngredientsOutputSchema = z.object({
  ingredients: z.array(z.string()),
});

const autoSuggestTagOutputSchema = z.object({
  tags: z.array(z.string()),
});

type AutoSuggestTagEvent = StreamObservableEvent<
  "TAG",
  z.infer<typeof autoSuggestTagOutputSchema>
>;

type AutoSuggestIngredientEvent = StreamObservableEvent<
  "INGREDIENT",
  z.infer<typeof autoSuggestIngredientsOutputSchema>
>;

export const sessionMachine = setup({
  types: {
    input: {} as Input,
    context: {} as {
      distinctId: string;
      prompt: string;
      suggestedTags: string[];
      suggestedTagsResultId?: string;
      suggestedIngredients: string[];
      suggestedIngredientssResultId?: string;
    },
    events: {} as AppEvent | AutoSuggestTagEvent | AutoSuggestIngredientEvent,
  },
  actors: {
    // autoSuggestMachine,
  },
  actions: {
    resetSuggestions: assign({
      suggestedTags: [],
      suggestedTagsResultId: "",
      suggestedIngredients: [],
      suggestedIngredientssResultId: "",
    }),
  },
}).createMachine({
  id: "UserAppMachine",
  context: ({ input }) => ({
    distinctId: input.id,
    prompt: "",
    suggestedTags: [],
    suggestedIngredients: [],
  }),
  type: "parallel",
  states: {
    Craft: {
      type: "parallel",
      states: {
        Input: {
          on: {
            CLEAR: {
              actions: [
                "resetSuggestions",
                assign({
                  prompt: "",
                }),
              ],
            },
            ADD_TAG: {
              actions: [
                "resetSuggestions",
                assign({
                  prompt: ({ context, event }) =>
                    appendValueWithComma(context.prompt, event.tag),
                }),
              ],
            },
            ADD_INGREDIENT: {
              actions: [
                "resetSuggestions",
                assign({
                  prompt: ({ context, event }) =>
                    appendValueWithComma(context.prompt, event.ingredient),
                }),
              ],
            },
            SET_INPUT: {
              actions: [
                "resetSuggestions",
                assign({
                  prompt: ({ event }) => event.value,
                }),
              ],
            },
          },
        },

        Generators: {
          type: "parallel",
          states: {
            Tags: {
              initial: "Idle",
              on: {
                ADD_INGREDIENT: ".Generating",
                ADD_TAG: ".Generating",
                SET_INPUT: [
                  {
                    target: ".Holding",
                    guard: ({ event }) => !!event.value?.length,
                  },
                  { target: ".Idle" },
                ],
              },
              states: {
                Idle: {},
                Holding: {
                  after: {
                    500: {
                      target: "Generating",
                      guard: ({ context }) => !!context.prompt?.length,
                    },
                  },
                },
                Generating: {
                  entry: () => {
                    console.log("Generating");
                  },
                  on: {
                    TAG_START: {
                      actions: assign({
                        suggestedTagsResultId: ({ event }) => event.resultId,
                      }),
                    },
                    TAG_PROGRESS: {
                      actions: assign({
                        suggestedTags: ({ event }) => event.data.tags || [],
                      }),
                    },
                    TAG_COMPLETE: {
                      actions: assign({
                        suggestedTags: ({ event }) => event.data.tags,
                      }),
                    },
                  },
                  invoke: {
                    input: ({ context }) => ({ prompt: context.prompt }),
                    src: fromEventObservable(
                      ({ input }: { input: { prompt: string } }) => {
                        const tokenStream = new AutoSuggestTagsStream();
                        return from(tokenStream.getStream(input)).pipe(
                          switchMap((stream) => {
                            return streamToObservable(
                              stream,
                              "TAG",
                              autoSuggestTagOutputSchema
                            );
                          })
                        );
                      }
                    ),
                    onDone: {
                      target: "Idle",
                    },
                  },
                },
              },
            },
            Ingredients: {
              initial: "Idle",
              on: {
                ADD_INGREDIENT: ".Generating",
                ADD_TAG: ".Generating",
                SET_INPUT: [
                  {
                    target: ".Holding",
                    guard: ({ event }) => !!event.value?.length,
                  },
                  { target: ".Idle" },
                ],
              },
              states: {
                Idle: {},
                Holding: {
                  after: {
                    500: {
                      target: "Generating",
                      guard: ({ context }) => !!context.prompt?.length,
                    },
                  },
                },
                Generating: {
                  entry: () => {
                    console.log("Generating");
                  },
                  on: {
                    INGREDIENT_START: {
                      actions: assign({
                        suggestedIngredientssResultId: ({ event }) =>
                          event.resultId,
                      }),
                    },
                    INGREDIENT_PROGRESS: {
                      actions: assign({
                        suggestedIngredients: ({ event }) =>
                          event.data.ingredients || [],
                      }),
                    },
                    INGREDIENT_COMPLETE: {
                      actions: assign({
                        suggestedIngredients: ({ event }) =>
                          event.data.ingredients,
                      }),
                    },
                  },
                  invoke: {
                    input: ({ context }) => ({ prompt: context.prompt }),
                    src: fromEventObservable(
                      ({ input }: { input: { prompt: string } }) => {
                        const tokenStream = new AutoSuggestIngredientStream();
                        return from(tokenStream.getStream(input)).pipe(
                          switchMap((stream) => {
                            return streamToObservable(
                              stream,
                              "INGREDIENT",
                              autoSuggestIngredientsOutputSchema
                            );
                          })
                        );
                      }
                    ),
                    onDone: {
                      target: "Idle",
                    },
                  },
                },
              },
            },
            Recipes: {
              initial: "Idle",
              states: {
                Idle: {},
                Holding: {},
                Generating: {},
              },
            },
          },
        },
      },
    },
  },
});

class AutoSuggestTagsStream extends TokenStream<{ prompt: string }> {
  protected async getUserMessage(input: { prompt: string }): Promise<string> {
    return input.prompt;
  }

  protected async getSystemMessage(_: { prompt: string }): Promise<string> {
    const TEMPLATE = `
Given the below set of examples and user prompt to describe a recipe they would like to create, return back a relevant set of tags we can suggest to the user that might be appropriate.

Tags below are separate by type, select a balanced set of tags across types. In the response, format the tags as a YAML with a single key tags and then the list of tags. Return nothing else but the formatted YAML.
    
Here is the example tag set:

{
  "Inspiration": [
    "Asian",
    "Southeast",
    "French",
    "Italian",
    "German",
    "Mediterranean",
    "American",
    "Mexican",
    "Indian",
    "Thai",
    "Chinese",
    "Japanese",
    "Korean",
    "Brazilian",
    "Moroccan",
    "Greek",
    "Spanish",
    "Russian",
    "Turkish",
    "Vietnamese"
  ],
  "Audience": [
    "Adults & Children",
    "Young Children",
    "Babies",
    "Teenagers",
    "Seniors",
    "Singles",
    "Couples",
    "Large Families",
    "Health-Conscious",
    "Vegetarians",
    "Vegans",
    "Gluten-Free",
    "Dairy-Free",
    "Nut-Free",
    "Low Carb Dieters",
    "High Protein Diets",
    "Athletes",
    "Busy Professionals",
    "Budget Meals",
    "Gourmet Enthusiasts"
  ],
  "Servings": [
    "4 Adults",
    "6 Persons",
    "15-20",
    "2 Persons",
    "8 Persons",
    "10 Persons",
    "Single Serving",
    "3 Persons",
    "5 Persons",
    "7 Persons",
    "9 Persons",
    "12 Persons",
    "14 Persons",
    "16 Persons",
    "18 Persons",
    "20+ Persons",
    "Individual Portions",
    "Family Size",
    "Large Event",
    "Small Gathering"
  ],
  "Meal Type": [
    "Breakfast",
    "Brunch",
    "Lunch",
    "Snack",
    "Dinner",
    "Appetizer",
    "Main Course",
    "Side Dish",
    "Dessert",
    "Beverage",
    "Soup",
    "Salad",
    "Pasta",
    "Bread",
    "Sauce",
    "Marinade",
    "Stew",
    "Casserole",
    "Grill",
    "Roast"
  ],
  "Time": [
    "Tomorrow",
    "Today",
    "20 Minutes",
    "30 Minutes",
    "10 Minutes",
    "5 Minutes",
    "1 Hour",
    "Overnight",
    "15 Minutes",
    "45 Minutes",
    "2 Hours+",
    "Quick Prep",
    "Slow Cook",
    "Weeknight",
    "Weekend",
    "Morning Prep",
    "Afternoon Prep",
    "Evening Prep",
    "No Cook",
    "Make Ahead"
  ],
  "Nutritional Facts": [
    "15g Protein",
    "<300 Calories",
    "Low Cholesterol",
    "Low Carb",
    "High Fiber",
    "Low Sodium",
    "Sugar-Free",
    "High Calcium",
    "Low Fat",
    "Keto",
    "Paleo",
    "Whole30",
    "High Vitamin C",
    "Antioxidant-Rich",
    "Omega-3 Fatty Acids",
    "Gluten-Free",
    "Dairy-Free",
    "Nutrient-Dense",
    "Balanced Meal",
    "Low Calorie"
  ],
  "Ingredients to Exclude": [
    "No Vanilla",
    "No Soy Sauce",
    "No Wheat",
    "No Cow Milk",
    "No Nuts",
    "No Eggs",
    "No Shellfish",
    "No Pork",
    "No Beef",
    "No Fish",
    "No Sugar",
    "No Chocolate",
    "No Alcohol",
    "No Gluten",
    "No Dairy",
    "No Peanuts",
    "No Tomatoes",
    "No Corn",
    "No Yeast",
    "No Artificial Colors"
  ],
  "Kitchen Instrument": [
    "Oven",
    "Thermomix",
    "BBQ",
    "Smoker",
    "Stovetop",
    "Blender",
    "Food Processor",
    "Slow Cooker",
    "Pressure Cooker",
    "Air Fryer",
    "Microwave",
    "Toaster Oven",
    "Griddle",
    "Broiler",
    "Sous Vide",
    "Coffee Maker",
    "Hand Mixer",
    "Stand Mixer",
    "Juicer",
    "Grill Pan"
  ],
  "Substitutions": [
    "Corn Flour",
    "Almond Milk",
    "Coconut Sugar",
    "Gluten-Free Pasta",
    "Cauliflower Rice",
    "Zucchini Noodles",
    "Vegan Cheese",
    "Egg Substitute",
    "Agave Syrup",
    "Cashew Cream",
    "Tofu",
    "Tempeh",
    "Seitan",
    "Lentil Pasta",
    "Oat Flour",
    "Rice Milk",
    "Stevia",
    "Xylitol",
    "Chia Seeds",
    "Flaxseed Meal"
  ],
  "Cooking Time": [
    "Quick Cook",
    "Slow Cook",
    "Instant",
    "Less Than 30 Min",
    "1 Hour Meal",
    "Overnight",
    "Marinate Overnight",
    "Prep In Advance",
    "Quick Marinate",
    "Slow Roast",
    "Fast Broil",
    "Steam",
    "Sous Vide",
    "Simmer",
    "Bake",
    "Roast",
    "Grill",
    "Fry",
    "Saute",
    "Poach"
  ]
}
`;

    return TEMPLATE;
  }

  protected getDefaultTokens(): number {
    return 1024;
  }
}

class AutoSuggestIngredientStream extends TokenStream<{ prompt: string }> {
  protected async getUserMessage(input: { prompt: string }): Promise<string> {
    return input.prompt;
  }

  protected async getSystemMessage(_: { prompt: string }): Promise<string> {
    const TEMPLATE = `
Suggest a set of ingredients that would complement the user provided prompt. Do not include any of the same ingredients that are in the prompt.

In the response, format the ingredients as YAML with a single key 'ingredients' and then the list of tags. Return nothing else but the formatted YAML.
    
Be inspired from but not limited to the the list below.

[
  "Allspice",
  "Almonds",
  "Anise",
  "Apples",
  "Apricots",
  "Artichokes",
  "Arugula",
  "Asparagus",
  "Avocado",
  "Apple cider vinegar",
  "Bacon",
  "Baguette",
  "Baking powder",
  "Baking soda",
  "Balsamic vinegar",
  "Bananas",
  "Barley",
  "Basil",
  "Bay leaves",
  "Beets",
  "Bell peppers, green",
  "Bell peppers, red",
  "Bell peppers, yellow",
  "Black beans",
  "Blackberries",
  "Blueberries",
  "Bok choy",
  "Borlotti beans",
  "Brazil nuts",
  "Bread, whole wheat",
  "Bread, white",
  "Bread, multigrain",
  "Breadcrumbs",
  "Broccoli",
  "Broth, chicken",
  "Broth, beef",
  "Broth, vegetable",
  "Brown rice",
  "Brussels sprouts",
  "Bulgur",
  "Butter",
  "Buttermilk",
  "Butternut squash",
  "Cabbage, green",
  "Cabbage, red",
  "Cabbage, napa",
  "Cabbage, savoy",
  "Cacao",
  "Canned tomatoes, diced",
  "Canned tomatoes, whole",
  "Canned tomatoes, crushed",
  "Canola oil",
  "Capers",
  "Carrots",
  "Cashews",
  "Cauliflower",
  "Cayenne pepper",
  "Celery",
  "Cheddar cheese",
  "Cherries",
  "Chicken breast",
  "Chicken thighs",
  "Chicken wings",
  "Chickpeas",
  "Chili powder",
  "Chives",
  "Chocolate, dark",
  "Chocolate, milk",
  "Chocolate, white",
  "Chorizo",
  "Cilantro",
  "Cinnamon",
  "Clams",
  "Cloves",
  "Cocoa powder",
  "Coconut, shredded",
  "Coconut, flaked",
  "Coconut milk",
  "Coconut oil",
  "Cod",
  "Coffee",
  "Coriander, seeds",
  "Coriander, fresh",
  "Corn",
  "Cornflakes",
  "Cornmeal",
  "Cornstarch",
  "Cottage cheese",
  "Crab",
  "Cranberries",
  "Cream, heavy",
  "Cream, light",
  "Cream cheese",
  "Cucumbers",
  "Cumin",
  "Curry leaves",
  "Curry powder",
  "Dates",
  "Dill, fresh",
  "Dill seed",
  "Dough, bread",
  "Dough, pizza",
  "Duck breast",
  "Duck leg",
  "Dumplings",
  "Durum wheat",
  "Edamame",
  "Eggs, chicken",
  "Eggs, duck",
  "Eggs, quail",
  "Egg whites",
  "Egg yolks",
  "Eggplant",
  "Eggplant, Chinese",
  "Eggplant, Japanese",
  "Eggplant, Indian",
  "Eggplant, Italian",
  "Eggplant, globe",
  "Elderberries",
  "Endive",
  "Enokitake mushrooms",
  "Escargot",
  "Espresso",
  "Evaporated milk",
  "Extra virgin olive oil",
  "Fennel",
  "Fennel, sliced",
  "Fennel, chopped",
  "Fennel bulb",
  "Fennel seed",
  "Fenugreek",
  "Feta cheese",
  "Fettuccine",
  "Figs, fresh",
  "Figs, dried",
  "Fish sauce",
  "Flank steak",
  "Flax seeds",
  "Flounder",
  "Flour, all-purpose",
  "Flour, bread",
  "Flour, cake",
  "Flour, chickpea",
  "Flour, coconut",
  "Flour, corn",
  "Flour, rice",
  "Flour, rye",
  "Flour, tapioca",
  "Flour, teff",
  "Flour, whole wheat",
  "Foie gras",
  "Fontina cheese",
  "Frosting, chocolate",
  "Frosting, cream cheese",
  "Frosting, vanilla",
  "Fruit leather",
  "Fruit, dried mixed",
  "Fruit, fresh mixed",
  "Fudge, chocolate",
  "Fudge, peanut butter",
  "Fusilli",
  "Garlic, cloves",
  "Garlic, minced",
  "Garlic powder",
  "Garlic salt",
  "Gelatin, powdered",
  "Ghee",
  "Ginger, fresh",
  "Ginger, ground",
  "Ginger, crystallized",
  "Gnocchi",
  "Goat cheese, crumbled",
  "Goat cheese, soft",
  "Goat, leg",
  "Goji berries",
  "Golden syrup",
  "Gouda cheese",
  "Graham crackers, crushed",
  "Graham crackers, whole",
  "Granola",
  "Grapes, green",
  "Grapes, red",
  "Grapeseed oil",
  "Greek yogurt",
  "Green beans, fresh",
  "Green beans, frozen",
  "Green chilies",
  "Green onions, tops",
  "Green onions, bulbs",
  "Ground beef, lean",
  "Ground beef, regular",
  "Ground chicken",
  "Ground lamb",
  "Ground pork",
  "Ground turkey",
  "Gruyère cheese",
  "Guava, fresh",
  "Guava, paste",
  "Gummy bears",
  "Gyoza wrappers",
  "Ham, sliced",
  "Ham, whole",
  "Hamburger buns",
  "Hazelnuts, whole",
  "Hazelnuts, chopped",
  "Heavy cream",
  "Hemp seeds",
  "Herbs, mixed fresh",
  "Herbs, mixed dried",
  "Herring",
  "Himalayan pink salt",
  "Hoisin sauce",
  "Ice cream, vanilla",
  "Ice cream, chocolate",
  "Ice cream, strawberry",
  "Icing sugar, powdered",
  "Icing, chocolate",
  "Icing, cream cheese",
  "Icing, royal",
  "Instant yeast",
  "Irish cream",
  "Irish moss",
  "Italian sausage",
  "Italian seasoning, dried",
  "Jackfruit, ripe",
  "Jackfruit, green",
  "Jalapenos, fresh",
  "Jalapenos, pickled",
  "Jam, raspberry",
  "Jam, strawberry",
  "Jam, blueberry",
  "Jasmine rice",
  "Jell-O, various flavors",
  "Jelly, grape",
  "Jicama, raw",
  "Juice, apple",
  "Juice, cranberry",
  "Juice, grapefruit",
  "Juice, lemon",
  "Juice, lime",
  "Juice, orange",
  "Juice, pineapple",
  "Juice, pomegranate",
  "Juniper berries, dried",
  "Kale, curly",
  "Kale, lacinato",
  "Kale, red Russian",
  "Kamut grain",
  "Katsuobushi (bonito flakes)",
  "Ketchup",
  "Kidney beans, red",
  "Kidney beans, white",
  "Kiwi, green",
  "Kiwi, gold",
  "Kohlrabi, green",
  "Kohlrabi, purple",
  "Kombu seaweed",
  "Kosher salt",
  "Kumquats",
  "Kvass",
  "Lamb, chops",
  "Lamb, leg",
  "Lamb, shank",
  "Lard",
  "Lasagna sheets",
  "Leeks, white part",
  "Leeks, green part",
  "Lemongrass, stalk",
  "Lemons, zest",
  "Lemons, juice",
  "Lentils, green",
  "Lentils, red",
  "Lentils, black",
  "Lettuce, butterhead",
  "Lettuce, iceberg",
  "Lettuce, oak leaf",
  "Lettuce, radicchio",
  "Lettuce, romaine",
  "Lima beans, green",
  "Lima beans, white",
  "Lime, zest",
  "Lime, juice",
  "Lingonberries, fresh",
  "Lingonberries, jam",
  "Linguine pasta",
  "Liver, beef",
  "Liver, chicken",
  "Lobster tail",
  "Lobster, whole",
  "Lychee, fresh",
  "Lychee, canned",
  "Macadamia nuts, whole",
  "Macadamia nuts, crushed",
  "Macaroni pasta",
  "Mace, ground",
  "Mackerel, fresh",
  "Mango, ripe",
  "Mango, green",
  "Maple syrup, pure",
  "Margarine, stick",
  "Margarine, tub",
  "Marjoram, fresh",
  "Marjoram, dried",
  "Marmalade, orange",
  "Marmalade, lemon",
  "Marshmallows, mini",
  "Marshmallows, large",
  "Mascarpone cheese",
  "Matzo meal",
  "Mayonnaise, regular",
  "Mayonnaise, light",
  "Meatballs, beef",
  "Meatballs, chicken",
  "Meatballs, pork",
  "Meatballs, turkey",
  "Melon, cantaloupe",
  "Melon, honeydew",
  "Milk, almond",
  "Milk, buttermilk",
  "Milk, coconut",
  "Milk, cow's",
  "Milk, evaporated",
  "Milk, goat's",
  "Milk, soy",
  "Millet grain",
  "Mint leaves, fresh",
  "Mint, dried",
  "Miso, white",
  "Miso, red",
  "Miso, brown",
  "Molasses, dark",
  "Molasses, light",
  "Monkfish fillet",
  "Monosodium glutamate (MSG)",
  "Mozzarella cheese, fresh",
  "Mozzarella cheese, shredded",
  "Muffins, blueberry",
  "Muffins, bran",
  "Muffins, chocolate chip",
  "Mushrooms, button",
  "Mushrooms, cremini",
  "Mushrooms, oyster",
  "Mushrooms, portobello",
  "Mushrooms, shiitake",
  "Mussels, fresh",
  "Navy beans",
  "Nectarines, fresh",
  "Nori seaweed",
  "Nutmeg, whole",
  "Nutmeg, ground",
  "Nutritional yeast flakes",
  "Oats, rolled",
  "Oats, steel-cut",
  "Oats, quick-cooking",
  "Okra, fresh",
  "Okra, frozen",
  "Olive oil, extra virgin",
  "Olive oil, regular",
  "Olives, black",
  "Olives, green",
  "Olives, kalamata",
  "Onions, red",
  "Onions, white",
  "Onions, yellow",
  "Onions, green",
  "Oranges, navel",
  "Oranges, blood",
  "Oranges, mandarin",
  "Oranges, Seville",
  "Oregano, fresh",
  "Oregano, dried",
  "Oysters, fresh",
  "Oysters, smoked",
  "Oyster sauce",
  "Pace, chunky salsa",
  "Papaya, fresh",
  "Paprika, smoked",
  "Paprika, sweet",
  "Parmesan cheese, grated",
  "Parmesan cheese, block",
  "Parsley, curly",
  "Parsley, flat-leaf",
  "Parsnip, raw",
  "Passion fruit, pulp",
  "Pasta, angel hair",
  "Pasta, bow tie",
  "Pasta, penne",
  "Pasta, rigatoni",
  "Pasta, rotini",
  "Pastrami, sliced",
  "Pastry, puff",
  "Pastry, shortcrust",
  "Peanut butter, creamy",
  "Peanut butter, chunky",
  "Peanuts, roasted",
  "Peanuts, raw",
  "Pears, Bartlett",
  "Pears, Anjou",
  "Pears, Bosc",
  "Peas, green",
  "Peas, snap",
  "Pecans, whole",
  "Pecans, chopped",
  "Pectin, powder",
  "Pepper, black ground",
  "Pepper, white ground",
  "Pepper, bell green",
  "Pepper, bell red",
  "Pepper, bell yellow",
  "Pepper, cayenne",
  "Pepper, chili flakes",
  "Pepper, jalapeno",
  "Pepperoni, slices",
  "Pesto, basil",
  "Pesto, sun-dried tomato",
  "Pickles, dill",
  "Pickles, sweet",
  "Pico de gallo",
  "Pie crust, pre-made",
  "Pine nuts",
  "Pineapple, fresh",
  "Pineapple, canned chunks",
  "Pinto beans",
  "Pita bread",
  "Pizza sauce",
  "Plums, black",
  "Plums, red",
  "Polenta",
  "Pomegranate seeds",
  "Pomegranate juice",
  "Popcorn kernels",
  "Poppy seeds",
  "Pork belly",
  "Pork chop",
  "Pork loin",
  "Pork shoulder",
  "Pork, ground",
  "Porridge oats",
  "Portobello mushrooms",
  "Potato chips",
  "Potatoes, russet",
  "Potatoes, red",
  "Potatoes, sweet",
  "Potatoes, Yukon gold",
  "Poultry seasoning",
  "Powdered sugar",
  "Prawns, large",
  "Prawns, small",
  "Prosciutto, slices",
  "Provolone cheese",
  "Prunes, dried",
  "Pumpkin, canned",
  "Pumpkin, fresh",
  "Pumpkin seeds",
  "Pumpernickel bread",
  "Quail, whole",
  "Quail eggs",
  "Quiche, Lorraine",
  "Quiche, spinach",
  "Quinoa, white",
  "Quinoa, red",
  "Quinoa, black",
  "Quinoa flakes",
  "Rabbit, whole",
  "Radishes, red",
  "Raisins, black",
  "Raisins, golden",
  "Ramen noodles",
  "Raspberries, fresh",
  "Raspberries, frozen",
  "Ravioli, cheese",
  "Ravioli, meat",
  "Red snapper, fillet",
  "Red wine, dry",
  "Red wine vinegar",
  "Rhubarb, stalks",
  "Ribeye steak",
  "Rice, basmati",
  "Rice, brown",
  "Rice, jasmine",
  "Rice, wild",
  "Rice flour",
  "Rice noodles",
  "Rice vinegar",
  "Ricotta cheese",
  "Roast beef, sliced",
  "Rocket (arugula)",
  "Romaine lettuce",
  "Root beer",
  "Rosemary, fresh",
  "Rosemary, dried",
  "Rum, dark",
  "Rum, light",
  "Russet potatoes",
  "Rutabaga, raw",
  "Rye bread",
  "Rye flour",
  "Rye whiskey",
  "Saffron threads",
  "Sage, fresh",
  "Sage, dried",
  "Salami, sliced",
  "Salmon fillet, fresh",
  "Salmon fillet, smoked",
  "Salsa, mild",
  "Salsa, spicy",
  "Salt, sea",
  "Salt, table",
  "Salt, Himalayan pink",
  "Sardines, canned",
  "Sausage, breakfast",
  "Sausage, Italian",
  "Sausage, chorizo",
  "Sausage, Andouille",
  "Sauerkraut",
  "Scallops, sea",
  "Scallops, bay",
  "Scallions (green onions)",
  "Sesame oil",
  "Sesame seeds, black",
  "Sesame seeds, white",
  "Shallots",
  "Sherry, dry",
  "Sherry, sweet",
  "Sherry vinegar",
  "Shiitake mushrooms, fresh",
  "Shiitake mushrooms, dried",
  "Shrimp, large",
  "Shrimp, small",
  "Soba noodles",
  "Soda, baking",
  "Soda, club",
  "Sorghum syrup",
  "Sour cream",
  "Soy milk",
  "Soy sauce, dark",
  "Soy sauce, light",
  "Spaghetti",
  "Spaghetti squash",
  "Spinach, fresh",
  "Spinach, frozen",
  "Spring roll wrappers",
  "Sprouts, alfalfa",
  "Sprouts, bean",
  "Sriracha sauce",
  "Star anise, whole",
  "Steak, flank",
  "Steak, sirloin",
  "Stevia, powder",
  "Stilton cheese",
  "Strawberries, fresh",
  "Strawberries, frozen",
  "String beans, green",
  "String beans, yellow",
  "Sugar, brown",
  "Sugar, caster",
  "Sugar, granulated",
  "Sugar, powdered",
  "Sunflower oil",
  "Sunflower seeds",
  "Sweet corn, kernels",
  "Sweet corn, cob",
  "Sweet potatoes, orange",
  "Sweet potatoes, purple",
  "Swiss cheese",
  "Syrup, corn",
  "Syrup, maple",
  "Tahini paste",
  "Tamarind paste",
  "Tangerines",
  "Tapioca pearls",
  "Tarragon, fresh",
  "Tarragon, dried",
  "Tea, black",
  "Tea, green",
  "Tea, herbal",
  "Tequila",
  "Teriyaki sauce",
  "Thyme, fresh",
  "Thyme, dried",
  "Tilapia fillet",
  "Tofu, firm",
  "Tofu, silken",
  "Tomatillos, fresh",
  "Tomato juice",
  "Tomato paste",
  "Tomato sauce",
  "Tomatoes, cherry",
  "Tomatoes, plum",
  "Tomatoes, beefsteak",
  "Tortilla chips",
  "Tortilla, flour",
  "Tortilla, corn",
  "Trout, fillet",
  "Tuna, canned in oil",
  "Tuna, canned in water",
  "Turmeric, ground",
  "Turmeric, fresh root",
  "Turkey, breast",
  "Turkey, whole",
  "Turkey, ground",
  "Turnips, white",
  "Turnips, yellow",
  "Udon noodles",
  "Ugli fruit",
  "Umeboshi plums",
  "Unsweetened chocolate",
  "Vanilla beans",
  "Vanilla essence",
  "Vanilla extract",
  "Vanilla ice cream",
  "Veal cutlets",
  "Vegan cheese",
  "Vegan chocolate",
  "Vegetable broth",
  "Vegetable oil",
  "Vegetable shortening",
  "Vegemite",
  "Venison, steak",
  "Vermouth, dry",
  "Vermouth, sweet",
  "Vinaigrette, balsamic",
  "Vinaigrette, red wine",
  "Vinegar, apple cider",
  "Vinegar, balsamic",
  "Vinegar, malt",
  "Vinegar, rice",
  "Vinegar, white wine",
  "Vodka",
  "Vital wheat gluten",
  "Waffles, plain",
  "Wakame seaweed",
  "Walnuts, whole",
  "Walnuts, chopped",
  "Wasabi paste",
  "Wasabi powder",
  "Water chestnuts, canned",
  "Water, mineral",
  "Water, sparkling",
  "Watercress",
  "Watermelon, seedless",
  "Wheat bran",
  "Wheat flour, whole grain",
  "Wheat germ",
  "Whipped cream",
  "Whipping cream",
  "Whiskey, bourbon",
  "Whiskey, Irish",
  "White chocolate chips",
  "White chocolate, bar",
  "Whole grain mustard",
  "Whole wheat bread",
  "Whole wheat pasta",
  "Wine, red",
  "Wine, white",
  "Wine, cooking",
  "Worcestershire sauce",
  "Wonton wrappers",
  "Xanthan gum",
  "Xylitol, granulated",
  "Yam, whole",
  "Yeast, active dry",
  "Yeast, instant",
  "Yeast, fresh",
  "Yogurt, plain",
  "Yogurt, Greek",
  "Yogurt, flavored",
  "Yogurt, soy",
  "Yogurt, almond",
  "Yucca root",
  "Ziti pasta",
  "Zucchini, green",
  "Zucchini, yellow",
  "Zucchini blossoms",
  "Zucchini, baby",
  "Zest, lemon",
  "Zest, orange",
  "Zest, lime",
  "Za'atar spice mix"
] `;

    return TEMPLATE;
  }

  protected getDefaultTokens(): number {
    return 1024;
  }
}
