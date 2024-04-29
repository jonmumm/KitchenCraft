"use client";

import { Button } from "@/components/input/button";
import { PreferenceCard } from "@/components/settings/preference-card";
import { $preferences } from "@/stores/settings";
import { TasteSettings } from "@/types"; // Import PreferenceSettings type
import { useStore } from "@nanostores/react";
import { useRouter } from "next/navigation";

// Main Preferences component
export default function Taste() {
  const router = useRouter();
  const preferences = useStore($preferences);

  const handleNext = () => {
    router.push("/quiz/diet"); // Adjust the navigation route as necessary
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
            preferenceKey={key as keyof TasteSettings}
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
