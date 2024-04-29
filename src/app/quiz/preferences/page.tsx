"use client";

import { Button } from "@/components/input/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { OnboardingInput } from "@/types";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function Preferences() {
  const router = useRouter();

  // Initialize the state for preferences as undefined based on OnboardingInput
  const initialPreferencesState: OnboardingInput["preferences"] = {
    likesSpicy: undefined,
    quickRecipes: undefined,
    outdoorGrilling: undefined,
    cooksWithAlcohol: undefined,
    vegetarian: undefined,
    likesSeafood: undefined,
    preferOrganic: undefined,
    cookingForKids: undefined,
    lowSodium: undefined,
    usesFreshHerbs: undefined,
    bakesOften: undefined,
    onePotMeals: undefined,
    interestedInGourmet: undefined,
    usesDairySubstitutes: undefined,
    seasonalRecipes: undefined,
    glutenFree: undefined,
    vegan: undefined,
    highProtein: undefined,
    interestedInWeightLoss: undefined,
  };

  const [selectedPreferences, setSelectedPreferences] = useState(
    initialPreferencesState
  );

  // Handle preference selection changes
  const handleSelectPreference = (
    key: keyof OnboardingInput["preferences"],
    value: boolean
  ) => {
    setSelectedPreferences((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  // Navigate to the next page or submit the data
  const handleCTA = () => {
    // You might want to process the collected data here or move to another page
    console.log(selectedPreferences); // Example action
    router.push("/quiz/results");
  };

  // Preferences options mapping for better display names
  const preferencesDisplayNames: {
    [key in keyof OnboardingInput["preferences"]]: string;
  } = {
    likesSpicy: "Do you like spicy food?",
    quickRecipes: "Do you prefer quick recipes (under 30 minutes)?",
    outdoorGrilling: "Is outdoor grilling an option?",
    cooksWithAlcohol: "Do you cook with alcohol?",
    vegetarian: "Do you prefer vegetarian meals?",
    likesSeafood: "Do you like seafood?",
    preferOrganic: "Do you prefer organic ingredients?",
    cookingForKids: "Are you cooking for kids?",
    lowSodium: "Do you need low-sodium recipes?",
    usesFreshHerbs: "Do you prefer using fresh herbs?",
    bakesOften: "Do you bake often?",
    onePotMeals: "Do you prefer one-pot meals?",
    interestedInGourmet: "Are you interested in gourmet cooking?",
    usesDairySubstitutes: "Do you use dairy substitutes?",
    seasonalRecipes: "Do you follow seasonal recipes?",
    glutenFree: "Prefer gluten-free recipes?",
    vegan: "Are vegan meals a preference?",
    highProtein: "Do you focus on high-protein meals?",
    interestedInWeightLoss: "Interested in weight loss recipes?",
  };

  return (
    <div className="flex flex-col items-center justify-center relative">
      <h1 className="text-xl font-bold mb-4 px-4">Select Your Preferences</h1>
      <div className="space-y-4 w-full max-w-md px-4">
        {Object.entries(preferencesDisplayNames).map(([key, displayName]) => (
          <div key={key}>
            <div className="flex flex-row items-center gap-4">
              <label className="font-semibold flex-1">{displayName}</label>
              <ToggleGroup
                type="single"
                value={
                  typeof selectedPreferences[
                    key as keyof OnboardingInput["preferences"]
                  ] !== "undefined"
                    ? selectedPreferences[
                        key as keyof OnboardingInput["preferences"]
                      ]
                      ? "yes"
                      : "no"
                    : undefined
                }
                onValueChange={(value) =>
                  handleSelectPreference(
                    key as keyof OnboardingInput["preferences"],
                    value === "yes"
                  )
                }
              >
                <ToggleGroupItem value="no">No</ToggleGroupItem>
                <ToggleGroupItem value="yes">Yes</ToggleGroupItem>
              </ToggleGroup>
            </div>
          </div>
        ))}
      </div>

      <div className="sticky bottom-0 w-full p-2 flex justify-center">
        <Button
          className="mt-6 font-bold py-2 px-4 rounded w-full mb-6 sticky max-w-xl shadow-xl"
          onClick={handleCTA}
        >
          Finish
        </Button>
      </div>
    </div>
  );
}
