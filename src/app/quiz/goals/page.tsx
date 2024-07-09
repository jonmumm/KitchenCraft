"use client";
import { Card, CardContent } from "@/components/display/card";
import { Button } from "@/components/input/button";
import { GOALS_INPUT_KEY } from "@/constants/inputs";
import { COOKING_GOALS, CookingGoal } from "@/constants/onboarding";
import { usePageSessionStore } from "@/hooks/usePageSessionStore";
import { useSelectChoiceEventHandler } from "@/hooks/useSelectChoiceEventHandler";
import { useStore } from "@nanostores/react";
import { CheckSquare } from "lucide-react";
import { atom } from "nanostores";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function CookingGoals() {
  const store = usePageSessionStore();
  const [selectedGoals$] = useState(
    atom<CookingGoal[]>(store.get().context.userSnapshot?.context.goals!)
  );
  const router = useRouter();

  useSelectChoiceEventHandler(GOALS_INPUT_KEY, (event) => {
    // Toggle the goal from the selectedGoals$ as appropriate
    const prevGoals = selectedGoals$.get();
    let newGoals;
    const goal = event.value as CookingGoal;
    if (prevGoals.includes(goal)) {
      newGoals = prevGoals.filter((g) => g !== goal);
    } else {
      newGoals = [...prevGoals, goal];
    }
    selectedGoals$.set(newGoals);
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    router.prefetch("/quiz/preferences");
  }, [router]);

  const handleContinue = () => {
    router.push("/quiz/preferences");
    setLoading(true);
  };

  const Goals = () => {
    const selectedGoals = useStore(selectedGoals$);

    return (
      <>
        {COOKING_GOALS.map((goal, index) => (
          <Card
            key={goal}
            className={`cursor-pointer transition-all ${
              selectedGoals.includes(goal) ? "border-blue-500 border-2" : ""
            }`}
            event={{
              type: "SELECT_CHOICE",
              index,
              name: GOALS_INPUT_KEY,
              value: goal,
            }}
            // onClick={() => toggleGoal(goal)}
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
      </>
    );
  };

  const StickyCTA = () => {
    const selectedGoals = useStore(selectedGoals$);

    return (
      <Button
        size="xl"
        className="w-full"
        onClick={handleContinue}
        disabled={loading || selectedGoals.length === 0}
      >
        {!loading ? <>Continue</> : <>Loading</>}
      </Button>
    );
  };

  return (
    <div className="flex flex-col items-center justify-center relative gap-8 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold">I want to...</h1>
      <div className="w-full max-w-md space-y-3 px-4">
        <Goals />
      </div>
      <div className="sticky bottom-0 w-full p-4 max-w-xl mx-auto mb-16">
        <StickyCTA />
      </div>
    </div>
  );
}
