"use client";
import { Card, CardContent } from "@/components/display/card";
import { Button } from "@/components/input/button";
import { COOKING_GOALS, CookingGoal } from "@/constants/onboarding";
import { CheckSquare } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function CookingGoals() {
  const [selectedGoals, setSelectedGoals] = useState<CookingGoal[]>([]);
  const router = useRouter();

  const toggleGoal = (goal: CookingGoal) => {
    setSelectedGoals((prev) =>
      prev.includes(goal) ? prev.filter((g) => g !== goal) : [...prev, goal]
    );
  };

  useEffect(() => {
    router.prefetch("/quiz/preferences");
  }, [router]);

  const handleContinue = () => {
    router.push("/quiz/preferences");
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <h1 className="text-2xl font-bold mb-6">I want to...</h1>
      <div className="w-full max-w-md space-y-3 mb-20">
        {COOKING_GOALS.map((goal) => (
          <Card
            key={goal}
            className={`cursor-pointer transition-all ${
              selectedGoals.includes(goal) ? "border-blue-500 border-2" : ""
            }`}
            onClick={() => toggleGoal(goal)}
          >
            <CardContent className="flex items-center p-4">
              <div
                className={`w-6 h-6 border-2 rounded mr-3 flex items-center justify-center ${
                  selectedGoals.includes(goal)
                    ? "bg-blue-500 border-blue-500"
                    : "border-gray-300"
                }`}
              >
                {selectedGoals.includes(goal) && (
                  <CheckSquare className="w-5 h-5 text-white" />
                )}
              </div>
              <span className="text-lg">{goal}</span>
            </CardContent>
          </Card>
        ))}
      </div>
      {selectedGoals.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t">
          <Button
            size="xl"
            className="w-full max-w-md mx-auto"
            onClick={handleContinue}
          >
            Continue
          </Button>
        </div>
      )}
    </div>
  );
}
