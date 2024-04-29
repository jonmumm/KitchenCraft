"use client";

import { Card } from "@/components/display/card";
import { Button } from "@/components/input/button";
import { Checkbox } from "@/components/input/checkbox";
import { OnboardingInput } from "@/types";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function Diet() {
  const router = useRouter();

  // Initialize the state for diet as undefined based on OnboardingInput
  const initialDietState: OnboardingInput["diet"] = {
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
  };

  const [selectedDiet, setSelectedDiet] = useState(initialDietState);

  // Function to convert camelCase to Title Case
  const formatDisplayName = (key: string) => {
    return key
      .replace(/([A-Z])/g, " $1") // Insert a space before each uppercase letter
      .replace(/^./, (str) => str.toUpperCase()) // Capitalize the first letter
      .trim(); // Remove any leading or trailing whitespace
  };

  // Handle the toggle of checkbox value from card click event
  const handleToggleDietOption = (key: keyof OnboardingInput["diet"]) => {
    setSelectedDiet((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // Navigate to the next page
  const handleNext = () => {
    console.log(selectedDiet); // Optionally log the selected options
    router.push("/quiz/preferences");
  };

  return (
    <div className="flex flex-col items-center justify-center relative">
      <h1 className="text-xl font-bold px-4 text-center">
        Which of these apply to you?
      </h1>
      <div className="space-y-2 w-full max-w-md h-full p-4">
        {Object.entries(selectedDiet).map(([key, value]) => (
          <Card
            key={key}
            className="cursor-pointer p-4 flex flex-row justify-between items-center"
            onClick={() =>
              handleToggleDietOption(key as keyof OnboardingInput["diet"])
            }
          >
            <div className="flex-1">
              <span className="font-semibold">
                {formatDisplayName(key)}
              </span>
            </div>
            <Checkbox id={key} checked={!!value} />
          </Card>
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
