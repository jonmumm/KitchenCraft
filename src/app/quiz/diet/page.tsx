"use client";

import { Button } from "@/components/input/button";
import { DietCard } from "@/components/settings/diet-card";
import { $diet } from "@/stores/settings";
import { DietSettings } from "@/types"; // Import DietSettings type
import { useStore } from "@nanostores/react";
import { useRouter } from "next/navigation";

export default function Diet() {
  const router = useRouter();
  const diet = useStore($diet);

  const handleNext = () => {
    router.push("/quiz/equipment");
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
