import { StreamObservableEvent } from "@/lib/stream-to-observable";
import { TokenStream } from "@/lib/token-stream";
import { z } from "zod";

export const AutoSuggestTagOutputSchema = z.object({
  tags: z.array(z.string()),
});

export type AutoSuggestTagEvent = StreamObservableEvent<
  "TAG",
  z.infer<typeof AutoSuggestTagOutputSchema>
>;

export class AutoSuggestTagsStream extends TokenStream<{ prompt: string }> {
  protected async getUserMessage(input: { prompt: string }): Promise<string> {
    return input.prompt;
  }

  protected async getSystemMessage(_: { prompt: string }): Promise<string> {
    const TEMPLATE = `Return back a relevant set of tags we can suggest to the user that will help them further explore ideas for recipes to create. Do not include any tags that are effectively the same as what's already in the prompt. We want to encourage the user to add to the provided prompt by suggesting new tags.

Tags below are separate by type, select a balanced set of tags across types. In the response, format the tags as a YAML with a single key tags and then the list of tags. Return nothing else but the formatted YAML.
    
Be inspired by, but not limited to, this example tag set:

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
