"use client";

import { Separator } from "@/components/display/separator";
import { Button } from "@/components/input/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { OnboardingInput } from "@/types";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function Preferences() {
  const router = useRouter();

  const initialPreferencesState: OnboardingInput["preferences"] = {
    outdoorGrilling: undefined,
    quickRecipes: undefined,
    onePotMeals: undefined,
    cooksWithAlcohol: undefined,
    seasonalRecipes: undefined,
    bakesOften: undefined,
    interestedInGourmet: undefined,
    likesSpicy: undefined,
    likesSeafood: undefined,
    preferOrganic: undefined,
    usesFreshHerbs: undefined,
    highProtein: undefined,
    interestedInWeightLoss: undefined,
    farmToTable: undefined,
    noProcessedFoods: undefined,
  };

  const [selectedPreferences, setSelectedPreferences] = useState(initialPreferencesState);

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
    console.log(selectedPreferences); // Example action
    router.push("/quiz/results");
  };

  // Preferences options mapping for better display names
  const preferencesDisplayNames: {
    [key in keyof OnboardingInput["preferences"]]: string;
  } = {
    outdoorGrilling: "Is outdoor grilling an option for you?",
    quickRecipes: "Do you prefer quick recipes?",
    onePotMeals: "Do you prefer one-pot meals?",
    cooksWithAlcohol: "Do you cook with alcohol?",
    seasonalRecipes: "Do you follow seasonal recipes?",
    bakesOften: "Do you bake often?",
    interestedInGourmet: "Are you interested in gourmet cooking?",
    likesSpicy: "Do you like spicy food?",
    likesSeafood: "Do you like seafood?",
    preferOrganic: "Do you prefer organic ingredients?",
    usesFreshHerbs: "Do you prefer using fresh herbs?",
    highProtein: "Do you focus on high-protein meals?",
    interestedInWeightLoss: "Interested in weight loss recipes?",
    farmToTable: "Do you prefer farm-to-table ingredients?",
    noProcessedFoods: "Do you avoid processed foods?",
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
