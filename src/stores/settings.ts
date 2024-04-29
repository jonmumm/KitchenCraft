import {
  DietSettings,
  EquipmentSettings,
  ExperienceLevel,
  PreferenceSettings,
} from "@/types";
import { atom, map } from "nanostores";

export const $equipment = map<EquipmentSettings>({
  airFryer: undefined,
  slowCooker: undefined,
  instantPot: undefined,
  wok: undefined,
  sousVide: undefined,
  blender: undefined,
  standMixer: undefined,
  foodProcessor: undefined,
  dutchOven: undefined,
  castIronSkillet: undefined,
  pressureCooker: undefined,
  juicer: undefined,
  pastaMaker: undefined,
  breadMaker: undefined,
  iceCreamMaker: undefined,
  electricGrill: undefined,
  pizzaStone: undefined,
  coffeeGrinder: undefined,
  espressoMachine: undefined,
  toasterOven: undefined,
  microwave: undefined,
  conventionalOven: undefined,
});

export const $diet = map<DietSettings>({
  glutenFree: undefined,
  vegan: undefined,
  vegetarian: undefined,
  lactoseIntolerant: undefined,
  eggFree: undefined,
  nutFree: undefined,
  seafoodFree: undefined,
  wheatFree: undefined,
  soyFree: undefined,
  lowSodium: undefined,
  usesDairySubstitutes: undefined,
  noAlcohol: undefined,
  sugarFree: undefined,
  lowCarb: undefined,
  paleo: undefined,
  keto: undefined,
  mediterraneanDiet: undefined,
  pescatarian: undefined,
  flexitarian: undefined,
  whole30: undefined,
  diabeticFriendly: undefined,
  halal: undefined,
  kosher: undefined,
  ayurvedic: undefined,
});

export const $preferences = map<PreferenceSettings>({
  hotAndSpicyRegular: undefined,
  vegetableAvoider: undefined,
  dessertSkipper: undefined,
  redMeatRegular: undefined,
  seafoodSelector: undefined,
  herbPreference: undefined,
  cheeseOptional: undefined,
  breadEssential: undefined,
  nutFreePreference: undefined,
  rawFoodConsumer: undefined,
});

export const $experienceLevel = atom<ExperienceLevel | undefined>(undefined);
