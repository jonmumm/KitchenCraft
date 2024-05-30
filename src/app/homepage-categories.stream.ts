import { StreamObservableEvent } from "@/lib/stream-to-observable";
import { StructuredObjectStream } from "@/lib/structured-object-stream";
import { CategorySchema } from "@/schema";
import { DeepPartial } from "ai";
import { z, ZodSchema } from "zod";

export const HomepageCategoriesOutputSchema = z.object({
  items: z
    .array(CategorySchema)
    .describe(
      "Items in the personalized content feed. Should contain exactly 6 items."
    ),
});

export type HomepageCategoriesOutput = z.infer<
  typeof HomepageCategoriesOutputSchema
>;

export type HomepageCategoriesPartialOutput =
  DeepPartial<HomepageCategoriesOutput>;

export type HomepageCategoriesInput = {
  recentFavorites?: string[];
  recentLiked?: string[];
  recentViewed?: string[];
  personalizationContext: string;
  timeContext: string;
};

export const HOMEPAGE_CATEGORIES = "HOMEPAGE_CATEGORIES";

export type HomepageCategoriesEvent = StreamObservableEvent<
  typeof HOMEPAGE_CATEGORIES,
  HomepageCategoriesOutput
>;

export class HomepageCategoriesStream extends StructuredObjectStream<
  HomepageCategoriesInput,
  HomepageCategoriesOutput
> {
  protected getSchema(): ZodSchema {
    return HomepageCategoriesOutputSchema;
  }

  protected async getUserMessage(
    input: HomepageCategoriesInput
  ): Promise<string> {
    return HOMEPAGE_CATEGORY_USER_TEMPLATE(input);
  }

  protected async getSystemMessage(
    input: HomepageCategoriesInput
  ): Promise<string> {
    return HOMEPAGE_CATEGORIES_SYSTEM_TEMPLATE(input);
  }

  protected getName(): string {
    return HOMEPAGE_CATEGORIES;
  }
}

const HOMEPAGE_CATEGORY_USER_TEMPLATE = (input: HomepageCategoriesInput) => `
${input.personalizationContext}
${input.timeContext}
`;

const HOMEPAGE_CATEGORIES_SYSTEM_TEMPLATE = (
  input: HomepageCategoriesInput
) => `Help generate a feed of recipes, grouped by categories. Ther user will provide a profile about themselves, use that to help guide/inspire suggestions for categories and recipes.

Example output:

${EXAMPLE_OUTPUT(input)}`;

const EXAMPLE_OUTPUT = (input: HomepageCategoriesInput) => `{
  items: [
    {
      category: "🔍 Recommended for You",
      color: "#FF6347",
      description: "Personalized suggestions based on your cooking habits.",
      recipes: [
        {
          name: "BBQ Chicken Pizza",
          tagline: "Smoky and cheesy"
        },
        {
          name: "Homemade Fish Sticks",
          tagline: "Crispy and kid-friendly"
        },
        {
          name: "Beef and Broccoli Stir Fry",
          tagline: "Savory and quick"
        }
      ]
    },
    {
      category: "🍂 Seasonal Picks",
      color: "#FFD700",
      description: "Recipes that are perfect for the current season.",
      recipes: [
        {
          name: "Grilled Summer Vegetables",
          tagline: "Fresh and smoky"
        },
        {
          name: "Strawberry Spinach Salad",
          tagline: "Sweet and tangy"
        },
        {
          name: "Lemon Herb Chicken",
          tagline: "Bright and zesty"
        }
      ]
    },
    {
      category: "⏱️ Quick & Easy",
      color: "#00CED1",
      description: "Simple recipes that can be made in a short amount of time.",
      recipes: [
        {
          name: "15-Minute Shrimp Tacos",
          tagline: "Fast and flavorful"
        },
        {
          name: "Chicken Quesadillas",
          tagline: "Cheesy and satisfying"
        },
        {
          name: "Veggie Stir Fry with Rice",
          tagline: "Colorful and simple"
        }
      ]
    },
    ${
      input.recentFavorites &&
      `{
      category: "💖 Inspired From Favorites",
      color: "#FF69B4",
      description: "Recipes you have favorited.",
      recipes: [
        {
          name: "Classic Beef Chili",
          tagline: "Hearty and warming"
        },
        {
          name: "Homemade Pizza",
          tagline: "Customizable and fun"
        },
        {
          name: "Chicken Alfredo Pasta",
          tagline: "Creamy and rich"
        }
      ]
    },`
    }
    {
      category: "👨‍👩‍👧‍👦 Family Favorites",
      color: "#FF4500",
      description: "Recipes that are loved by families.",
      recipes: [
        {
          name: "Spaghetti and Meatballs",
          tagline: "Classic family dinner"
        },
        {
          name: "Cheesy Chicken Casserole",
          tagline: "Comforting and filling"
        },
        {
          name: "Homemade Sloppy Joes",
          tagline: "Messy and delicious"
        }
      ]
    },
    {
      category: "🎉 Weekend Specials",
      color: "#1E90FF",
      description: "Special recipes for a weekend treat.",
      recipes: [
        {
          name: "BBQ Ribs",
          tagline: "Slow-cooked perfection"
        },
        {
          name: "Stuffed Pork Chops",
          tagline: "Juicy and flavorful"
        },
        {
          name: "Grilled Shrimp Skewers",
          tagline: "Light and tasty"
        }
      ]
    },
    {
      category: "🥗 Healthy Choices",
      color: "#32CD32",
      description: "Nutritious and healthy recipe options.",
      recipes: [
        {
          name: "Grilled Salmon with Avocado Salsa",
          tagline: "Fresh and nutritious"
        },
        {
          name: "Quinoa and Black Bean Salad",
          tagline: "Protein-packed"
        },
        {
          name: "Roasted Brussels Sprouts",
          tagline: "Crispy and healthy"
        }
      ]
    },
    {
      category: "🍲 Comfort Food",
      color: "#8B4513",
      description: "Comforting and hearty recipes.",
      recipes: [
        {
          name: "Chicken Pot Pie",
          tagline: "Warm and hearty"
        },
        {
          name: "Creamy Tomato Soup",
          tagline: "Smooth and comforting"
        },
        {
          name: "Baked Ziti",
          tagline: "Cheesy and satisfying"
        }
      ]
    },
    {
      category: "🌍 International Cuisine",
      color: "#FFD700",
      description: "Recipes from various global cuisines.",
      recipes: [
        {
          name: "Chicken Tikka Masala",
          tagline: "Rich and flavorful"
        },
        {
          name: "Beef Tacos",
          tagline: "Spicy and savory"
        },
        {
          name: "Vegetable Stir Fry",
          tagline: "Colorful and tasty"
        }
      ]
    },
    {
      category: "👶 Kid-Friendly",
      color: "#FF69B4",
      description: "Recipes suitable for children.",
      recipes: [
        {
          name: "Mini Pizzas",
          tagline: "Fun and easy"
        },
        {
          name: "Chicken Nuggets",
          tagline: "Crispy and tender"
        },
        {
          name: "Pasta with Butter and Parmesan",
          tagline: "Simple and tasty"
        }
      ]
    },
    {
      category: "💰 Budget-Friendly",
      color: "#32CD32",
      description: "Affordable recipes for users on a budget.",
      recipes: [
        {
          name: "Black Bean Burritos",
          tagline: "Affordable and filling"
        },
        {
          name: "Chicken and Rice Casserole",
          tagline: "Hearty and budget-friendly"
        },
        {
          name: "Lentil Soup",
          tagline: "Healthy and cheap"
        }
      ]
    },
    {
      category: "🎈 Party Pleasers",
      color: "#FF4500",
      description: "Recipes perfect for parties and gatherings.",
      recipes: [
        {
          name: "Buffalo Chicken Dip",
          tagline: "Spicy and creamy"
        },
        {
          name: "Pulled Pork Sliders",
          tagline: "Savory and delicious"
        },
        {
          name: "Stuffed Mushrooms",
          tagline: "Elegant and tasty"
        }
      ]
    },
    {
      category: "🚀 On-the-Go",
      color: "#1E90FF",
      description: "Quick recipes for users on the move.",
      recipes: [
        {
          name: "Turkey Wraps",
          tagline: "Quick and easy"
        },
        {
          name: "Veggie and Hummus Sandwiches",
          tagline: "Healthy and portable"
        },
        {
          name: "Fruit and Yogurt Parfaits",
          tagline: "Fresh and convenient"
        }
      ]
    },
    {
      category: "🎄 Holiday Favorites",
      color: "#FFD700",
      description: "Recipes suitable for upcoming holidays.",
      recipes: [
        {
          name: "Roast Turkey with Stuffing",
          tagline: "Classic holiday meal"
        },
        {
          name: "Pumpkin Pie",
          tagline: "Spiced and sweet"
        },
        {
          name: "Holiday Sugar Cookies",
          tagline: "Festive and fun"
        }
      ]
    },
    {
      category: "👩‍🍳 Chef's Choice",
      color: "#FF6347",
      description: "Curated recipes by professional chefs.",
      recipes: [
        {
          name: "Beef Wellington",
          tagline: "Gourmet and impressive"
        },
        {
          name: "Lobster Bisque",
          tagline: "Rich and creamy"
        },
        {
          name: "Chocolate Soufflé",
          tagline: "Decadent and fluffy"
        }
      ]
    },
    {
      category: "🌟 Ingredient Spotlight",
      color: "#8B4513",
      description: "Recipes featuring specific ingredients.",
      recipes: [
        {
          name: "Avocado Toast",
          tagline: "Trendy and delicious"
        },
        {
          name: "Garlic Butter Shrimp",
          tagline: "Savory and succulent"
        },
        {
          name: "Zucchini Bread",
          tagline: "Moist and flavorful"
        }
      ]
    }
  ]
}`;
