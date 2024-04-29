"use client";

import { Button } from "@/components/input/button";
import { PreferenceCard } from "@/components/settings/preference-card";
import { $preferences } from "@/stores/settings";
import { PreferenceSettings } from "@/types"; // Import PreferenceSettings type
import { useStore } from "@nanostores/react";
import { useRouter } from "next/navigation";
<<<<<<< HEAD
import { useState } from "react";

// Create the preferences nanostore
const $preferences = map<PreferenceSettings>({
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

// Define the descriptive questions for each preference
const preferencesDisplayNames: {
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

// PreferenceCard component
function PreferenceCard({
  preferenceKey,
}: {
  preferenceKey: keyof PreferenceSettings;
}) {
  const preferences = useStore($preferences);
  const session = useSessionStore();
  const [toggleValue, setToggleValue] = useState(() => {
    const sessionValue =
      session.get().context.browserSessionSnapshot?.context.preferences[
        preferenceKey
      ];
    return typeof sessionValue !== "undefined"
      ? sessionValue
        ? "yes"
        : "no"
      : undefined;
  });
  const send = useSend();

  const handleToggle = (value: boolean) => {
    const newValue = toggleValue === (value ? "yes" : "no") ? undefined : value;
    send({
      type: "PREFERENCE_CHANGE",
      preference: preferenceKey,
      value: newValue,
    });
    $preferences.setKey(preferenceKey, newValue);
    setToggleValue(newValue ? "yes" : "no");
  };

  return (
    <div className="flex flex-row justify-between items-center gap-4">
      <div className="flex-1">
        <label className="font-normal">
          {preferencesDisplayNames[preferenceKey]}
        </label>
      </div>
      <ToggleGroup
        type="single"
        value={toggleValue}
        onValueChange={(value) => handleToggle(value === "yes")}
      >
        <ToggleGroupItem variant="outline" value="no">No</ToggleGroupItem>
        <ToggleGroupItem variant="outline" value="yes">Yes</ToggleGroupItem>
      </ToggleGroup>
    </div>
  );
}
=======
>>>>>>> d3c6fcc (enable settings edting after quiz)

// Main Preferences component
export default function Preferences() {
  const router = useRouter();
  const preferences = useStore($preferences);

  const handleNext = () => {
    router.push("/quiz/results"); // Adjust the navigation route as necessary
  };

  return (
    <div className="flex flex-col items-center justify-center relative">
      <h1 className="text-xl font-bold px-4 text-center">
        Check all that apply
      </h1>
      <div className="space-y-2 w-full max-w-xl h-full p-4">
        {Object.keys(preferences).map((key) => (
          <PreferenceCard
            key={key}
            preferenceKey={key as keyof PreferenceSettings}
          />
        ))}
      </div>
      <div className="sticky bottom-0 w-full p-2 flex justify-center">
        <Button
          className="mt-6 font-bold py-2 px-4 rounded w-full mb-6 sticky max-w-xl shadow-xl"
          onClick={handleNext}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
