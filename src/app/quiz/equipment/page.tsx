"use client";

import { Button } from "@/components/input/button";
import { EquipmentCard } from "@/components/settings/equipment-card";
import { $equipment } from "@/stores/settings";
import { EquipmentSettings } from "@/types";
import { useStore } from "@nanostores/react";
import { Loader2Icon } from "lucide-react";
import { useRouter } from "next/navigation";

export default function Equipment() {
  const router = useRouter();
  const equipment = useStore($equipment);

  const handleNext = () => {
    router.push("/quiz/results");
  };

  return (
    <div className="flex flex-col items-center justify-center relative">
      <h1 className="text-xl font-bold px-4 text-center text-balance">
        Which do you own?
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
          className="mt-6 font-bold py-2 px-4 rounded w-full mb-6 max-w-xl shadow-xl transitioning:opacity-50"
          onClick={handleNext}
        >
          <span className="transitioning:hidden">Next</span>
          <Loader2Icon className="transitioning:block hidden animate-spin" />
        </Button>
      </div>
    </div>
  );
}
