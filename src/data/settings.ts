import { TasteSettings } from "@/types";

export const preferencesDisplayNames: {
  [key in keyof TasteSettings]: string;
} = {
  preferSaltyOverSweet: "Prefer salty over sweet snacks?",
  preferChocolateyOverFruity: "Prefer chocolatey over fruity desserts?",
  enjoyRawOnions: "Enjoy raw onions in dishes?",
  needSpicyElements: "Need spicy elements in meals?",
  preferBlackCoffee: "Prefer black coffee over sweetened?",
  likeLemonInBeverages: "Like lemon in beverages?",
  favorBoldCheeses: "Favor bold cheeses over mild?",
  preferHeavilySeasoned: "Prefer heavily seasoned dishes?",
  enjoyBitterFoods: "Enjoy bitter foods like dark chocolate?",
  preferRawVegetables: "Prefer raw vegetables over cooked?",
  breadBetterWithButterOrOil: "Bread better with butter or oil?",
  preferCreamyOverChunkySoups: "Prefer creamy over chunky soups?",
  chooseRiceOverPotatoes: "Choose rice over potatoes as a side?",
  preferScrambledOverFriedEggs: "Prefer scrambled eggs over fried?",
  likeGrilledFishOverFried: "Like grilled fish over fried?",
  preferFruitAsSnack: "Prefer fruit as a snack rather than in meals?",
  dessertBetterWarm: "Dessert better warm than cold?",
  enjoyGingerInFood: "Enjoy the taste of ginger in food?",
  saladAppealingWithoutDressing: "Salad appealing without dressing?",
  preferPastaWithRedSauce: "Prefer pasta with red sauce over white?",
};
