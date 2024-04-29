"use client";

import { Card } from "@/components/display/card";
import { Button } from "@/components/input/button";
import { Checkbox } from "@/components/input/checkbox";
import { useEventHandler } from "@/hooks/useEventHandler";
import { OnboardingInput } from "@/types";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function Equipment() {
  const router = useRouter();

  // Initialize the state for equipment as undefined based on OnboardingInput
  const initialEquipmentState: OnboardingInput["equipment"] = {
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
  };

  const [selectedEquipment, setSelectedEquipment] = useState(
    initialEquipmentState
  );

  // Handle the toggle of checkbox value from card click event
  useEventHandler("SELECT_VALUE", (event) => {
    if (event.name && event.value !== undefined) {
      setSelectedEquipment((prev) => ({
        ...prev,
        [event.name]: event.value,
      }));
    }
  });

  // Function to convert camelCase to Title Case
  const formatDisplayName = (key: string) => {
    return key
      .replace(/([A-Z])/g, " $1") // Insert a space before each uppercase letter
      .replace(/^./, (str) => str.toUpperCase()) // Capitalize the first letter
      .trim(); // Remove any leading or trailing whitespace
  };

  // Navigate to the next page
  const handleNext = () => {
    router.push("/quiz/diet");
  };

  return (
    <div className="flex flex-col items-center justify-center relative">
      <h1 className="text-xl font-bold px-4 text-center text-balance">
        Select your cooking equipment
      </h1>
      <div className="space-y-2 w-full max-w-md h-full p-4">
        {Object.entries(selectedEquipment).map(([key, value]) => (
          <Card
            key={key}
            className="cursor-pointer p-4 flex flex-row justify-between items-center"
            onClick={() =>
              setSelectedEquipment((prev) => ({ ...prev, [key]: !value }))
            }
          >
            <div className="flex-1">
              <label htmlFor={key} className="font-semibold">
                {formatDisplayName(key)}
              </label>
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
