"use client";

// EquipmentSelection.tsx
import { Card } from "@/components/display/card";
import { Checkbox } from "@/components/input/checkbox";
import { useSend } from "@/hooks/useSend";
import { usePageSessionStore } from "@/hooks/usePageSessionStore";
import { formatDisplayName } from "@/lib/utils";
import { $equipment } from "@/stores/settings";
import { EquipmentSettings } from "@/types";
import { useStore } from "@nanostores/react";
import { useState } from "react";

// Define the Zod schema for equipment settings

// Create the equipment nanostore
export function EquipmentCard({
  equipmentKey,
}: {
  equipmentKey: keyof EquipmentSettings;
}) {
  const equipment = useStore($equipment, { keys: [equipmentKey] });
  const send = useSend();
  const session = usePageSessionStore();
  const [checked, setChecked] = useState(
    !!session.get().context.sessionSnapshot?.context.equipment[
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
