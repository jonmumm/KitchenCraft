"use client";

import { Button } from "@/components/input/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
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

  // Handle selection changes
  const handleSelectEquipment = (
    key: keyof OnboardingInput["equipment"],
    value: boolean
  ) => {
    setSelectedEquipment((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  // Navigate to the next page
  const handleNext = () => {
    router.push("/quiz/preferences");
  };

  // Equipment options mapping for better display names
  const equipmentDisplayNames: {
    [key in keyof OnboardingInput["equipment"]]: string;
  } = {
    airFryer: "Air Fryer",
    slowCooker: "Slow Cooker",
    instantPot: "Instant Pot",
    wok: "Wok",
    sousVide: "Sous Vide",
    blender: "Blender",
    standMixer: "Stand Mixer",
    foodProcessor: "Food Processor",
    dutchOven: "Dutch Oven",
    castIronSkillet: "Cast Iron Skillet",
    pressureCooker: "Pressure Cooker",
    juicer: "Juicer",
    pastaMaker: "Pasta Maker",
    breadMaker: "Bread Maker",
    iceCreamMaker: "Ice Cream Maker",
    electricGrill: "Electric Grill",
    pizzaStone: "Pizza Stone",
    coffeeGrinder: "Coffee Grinder",
    espressoMachine: "Espresso Machine",
    toasterOven: "Toaster Oven",
    microwave: "Microwave",
    conventionalOven: "Conventional Oven",
  };

  return (
    <div className="flex flex-col items-center justify-center p-4">
      <h1 className="text-xl font-bold mb-4">Select Your Equipment</h1>
      <div className="space-y-2 w-full max-w-md">
        {Object.entries(equipmentDisplayNames).map(([key, displayName]) => (
          <div key={key} className="flex flex-row items-center">
            <label className="font-semibold flex-1">{displayName}</label>
            <ToggleGroup
              type="single"
              value={
                typeof selectedEquipment[
                  key as keyof OnboardingInput["equipment"]
                ] !== "undefined"
                  ? selectedEquipment[key as keyof OnboardingInput["equipment"]]
                    ? "yes"
                    : "no"
                  : undefined
              }
              onValueChange={(value) =>
                handleSelectEquipment(
                  key as keyof OnboardingInput["equipment"],
                  value === "yes"
                )
              }
            >
              <ToggleGroupItem value="no">No</ToggleGroupItem>
              <ToggleGroupItem value="yes">Yes</ToggleGroupItem>
            </ToggleGroup>
          </div>
        ))}
      </div>
      <Button
        // href="/quiz/preferences"
        className="mt-6 font-bold py-2 px-4 rounded w-full mb-20 sticky max-w-xl"
        onClick={handleNext}
      >
        Next
      </Button>
    </div>
  );
}
