import { preferencesDisplayNames } from "@/data/settings";
import { SessionContext } from "@/types";
import { formatDisplayName } from "./utils";

type PersonalizationOptions = Pick<
  SessionContext,
  | "shoppingFrequency"
  | "groceryStores"
  | "typicalGroceries"
  | "experienceLevel"
  | "equipment"
  | "diet"
  | "preferences"
  | "country"
  | "region"
  | "city"
  | "timezone"
>;

export function getTimeContext(timezone: string): string {
  const now = new Date();

  const optionsDate: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: timezone,
  };
  const formattedDate = new Intl.DateTimeFormat("en-US", optionsDate).format(
    now
  );

  const optionsTime: Intl.DateTimeFormatOptions = {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: timezone,
  };
  const formattedTime = new Intl.DateTimeFormat("en-US", optionsTime).format(
    now
  );

  const optionsDayOfWeek: Intl.DateTimeFormatOptions = {
    weekday: "long",
    timeZone: timezone,
  };
  const dayOfWeek = new Intl.DateTimeFormat("en-US", optionsDayOfWeek).format(
    now
  );

  return `Date: ${formattedDate}\nTime of Day: ${formattedTime}\nDay of Week: ${dayOfWeek}`;
}

export function getPersonalizationContext(
  options: PersonalizationOptions
): string {
  let context: string[] = [];

  if (options.shoppingFrequency) {
    context.push(`Shopping Frequency: ${options.shoppingFrequency}`);
  }

  if (options.groceryStores) {
    context.push(`Frequent Grocery Stores: ${options.groceryStores}`);
  }

  if (options.typicalGroceries) {
    context.push(`Typical Groceries: ${options.typicalGroceries}`);
  }

  if (options.experienceLevel) {
    context.push(`Experience Level: ${options.experienceLevel}`);
  }

  if (options.equipment) {
    const equipmentKeys = Object.keys(options.equipment) as Array<
      keyof typeof options.equipment
    >;
    const availableEquipment = equipmentKeys
      .filter((key) => options.equipment[key])
      .map(formatDisplayName);
    if (availableEquipment.length > 0) {
      context.push(`Available Equipment: ${availableEquipment.join(", ")}`);
    }
  }

  if (options.diet) {
    const dietKeys = Object.keys(options.diet) as Array<
      keyof typeof options.diet
    >;
    const dietaryRestrictions = dietKeys.filter((key) => options.diet[key]).map(formatDisplayName);
    if (dietaryRestrictions.length > 0) {
      context.push(`Dietary Restrictions: ${dietaryRestrictions.join(", ")}`);
    }
  }

  if (options.preferences) {
    const tasteKeys = Object.keys(options.preferences) as Array<
      keyof typeof options.preferences
    >;
    const tastePreferences = tasteKeys.filter(
      (key) => options.preferences[key] !== undefined
    ); // Changed to check for undefined
    if (tastePreferences.length > 0) {
      const preferenceDescriptions = tastePreferences.map((key) => {
        const setting = options.preferences[key];
        return `${preferencesDisplayNames[key]}: ${setting ? "Yes" : "No"}`; // Show Yes/No based on boolean
      });
      context.push(`Taste Preferences: ${preferenceDescriptions.join(", ")}`);
    }
  }

  if (options.city || options.country || options.timezone) {
    context.push(
      `Location: ${[options.city, options.region, options.country]
        .filter(Boolean)
        .join(", ")}${
        options.timezone ? ", Timezone: " + options.timezone : ""
      }`
    );
  }

  return context.join("\n");
}
