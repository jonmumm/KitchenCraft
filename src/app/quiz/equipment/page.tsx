"use client";

// EquipmentSelection.tsx
import { Card } from "@/components/display/card";
import { Button } from "@/components/input/button";
import { Checkbox } from "@/components/input/checkbox";
import { useSend } from "@/hooks/useSend";
import { useSessionStore } from "@/hooks/useSessionStore";
import { formatDisplayName } from "@/lib/utils";
import { EquipmentSettings } from "@/types";
import { useStore } from "@nanostores/react";
import { map } from "nanostores";
import { useRouter } from "next/navigation";
import { useState } from "react";

// Define the Zod schema for equipment settings

// Create the equipment nanostore
const $equipment = map<EquipmentSettings>({
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

function EquipmentCard({
  equipmentKey,
}: {
  equipmentKey: keyof EquipmentSettings;
}) {
  const equipment = useStore($equipment, { keys: [equipmentKey] });
  const send = useSend();
  const session = useSessionStore();
  const [checked, setChecked] = useState(
    !!session.get().context.browserSessionSnapshot?.context.equipment[
      equipmentKey
    ]
  );

  const toggleEquipment = () => {
    const value = !equipment[equipmentKey];
    send({ type: "EQUIPMENT_CHANGE", equipment: equipmentKey, value });
    $equipment.setKey(equipmentKey, value);
    setChecked(true);
  };

  return (
    <Card
      className="cursor-pointer p-4 flex flex-row justify-between items-center"
      onClick={toggleEquipment}
    >
      <div className="flex-1">
        <span className="font-semibold">{formatDisplayName(equipmentKey)}</span>
      </div>
      <Checkbox id={equipmentKey} checked={checked} />
    </Card>
  );
}

// Main Equipment component
export default function Equipment() {
  const router = useRouter();
  const equipment = useStore($equipment);

  const handleNext = () => {
    router.push("/quiz/diet");
  };

  return (
    <div className="flex flex-col items-center justify-center relative">
      <h1 className="text-xl font-bold px-4 text-center text-balance">
        Select your cooking equipment
      </h1>
      <div className="space-y-2 w-full max-w-md h-full p-4">
        {Object.keys(equipment).map((key) => (
          <EquipmentCard
            key={key}
            equipmentKey={key as keyof EquipmentSettings}
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
