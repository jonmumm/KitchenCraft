import { PreferenceSettings } from "@/types";

export const preferencesDisplayNames: {
  [key in keyof PreferenceSettings]: string;
} = {
  hotAndSpicyRegular: "Do you regularly include spicy foods in your meals?",
  vegetableAvoider:
    "Do you often choose to exclude vegetables from your meals?",
  dessertSkipper: "Do you generally avoid eating desserts?",
  redMeatRegular: "Is red meat a frequent choice in your meals?",
  seafoodSelector: "Do you specifically seek out seafood dishes?",
  herbPreference: "Do you prefer dishes with a noticeable use of fresh herbs?",
  cheeseOptional:
    "Do you often opt out of adding cheese to dishes where it's not a main ingredient?",
  breadEssential: "Is bread a must-have component in your meals?",
  nutFreePreference: "Do you prefer to avoid nuts in your dishes?",
  rawFoodConsumer: "Do you eat raw food (e.g., sushi, beef tartare, etc.)?",
};
