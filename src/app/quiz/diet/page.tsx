"use client";

import { Card } from "@/components/display/card";
import { Button } from "@/components/input/button";
import { Checkbox } from "@/components/input/checkbox";
import { useSend } from "@/hooks/useSend";
import { formatDisplayName } from "@/lib/utils"; // Assuming this utility is already implemented
import { DietSettings } from "@/types"; // Import DietSettings type
import { useStore } from "@nanostores/react";
import { map } from "nanostores";
import { useRouter } from "next/navigation";

// Create the diet nanostore
const $diet = map<DietSettings>({
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

// DietCard component
function DietCard({ dietKey }: { dietKey: keyof DietSettings }) {
  const diet = useStore($diet, { keys: [dietKey] });
  const send = useSend();

  const toggleDiet = () => {
    const value = !diet[dietKey];
    send({ type: "DIET_CHANGE", dietType: dietKey, value });
    $diet.setKey(dietKey, !diet[dietKey]);
  };

  return (
    <Card
      className="cursor-pointer p-4 flex flex-row justify-between items-center"
      onClick={toggleDiet}
    >
      <div className="flex-1">
        <span className="font-semibold">{formatDisplayName(dietKey)}</span>
      </div>
      <Checkbox id={dietKey} checked={!!diet[dietKey]} />
    </Card>
  );
}

// Main Diet component
export default function Diet() {
  const router = useRouter();
  const diet = useStore($diet);

  const handleNext = () => {
    router.push("/quiz/preferences");
  };

  return (
    <div className="flex flex-col items-center justify-center relative">
      <h1 className="text-xl font-bold px-4 text-center">
        Which of these apply to you?
      </h1>
      <div className="space-y-2 w-full max-w-md h-full p-4">
        {Object.keys(diet).map((key) => (
          <DietCard key={key} dietKey={key as keyof DietSettings} />
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
