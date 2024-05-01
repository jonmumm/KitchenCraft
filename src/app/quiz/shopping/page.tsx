"use client";

import { Button } from "@/components/input/button";
import { GroceryQuestions } from "@/components/settings/grocery";
import { $equipment } from "@/stores/settings";
import { useStore } from "@nanostores/react";
import { Loader2Icon } from "lucide-react";
import { useRouter } from "next/navigation";

export default function Shopping() {
  const router = useRouter();

  const handleNext = () => {
    router.push("/quiz/diet");
  };

  return (
    <div className="flex flex-col items-center justify-center relative">
      <div className="space-y-2 w-full max-w-md h-full p-4">
        <GroceryQuestions />
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
