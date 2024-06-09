"use client";

// EquipmentSelection.tsx
import { Card } from "@/components/display/card";
import { Checkbox } from "@/components/input/checkbox";
import { useSend } from "@/hooks/useSend";
import { usePageSessionStore } from "@/hooks/usePageSessionStore";
import { formatDisplayName } from "@/lib/utils";
import { $diet } from "@/stores/settings";
import { DietSettings } from "@/types";
import { useStore } from "@nanostores/react";
import { useState } from "react";

export function DietCard({ dietKey }: { dietKey: keyof DietSettings }) {
  const diet = useStore($diet, { keys: [dietKey] });
  const send = useSend();
  const session = usePageSessionStore();
  const [checked, setChecked] = useState(
    !!session.get().context.sessionSnapshot?.context.diet[dietKey]
  );

  const toggleDiet = () => {
    const value = !diet[dietKey];
    send({ type: "DIET_CHANGE", dietType: dietKey, value });
    $diet.setKey(dietKey, value);
    setChecked(value);
  };

  return (
    <Card
      className="cursor-pointer p-4 flex flex-row justify-between items-center"
      onClick={toggleDiet}
    >
      <div className="flex-1">
        <span className="font-semibold">{formatDisplayName(dietKey)}</span>
      </div>
      <Checkbox id={dietKey} checked={checked} />
    </Card>
  );
}
