"use client";

import { Card, CardDescription, CardTitle } from "@/components/display/card";
import { Button } from "@/components/input/button";
import { useEventHandler } from "@/hooks/useEventHandler";
import { useSend } from "@/hooks/useSend";
import { usePageSessionStore } from "@/hooks/usePageSessionStore";
import { assert } from "@/lib/utils";
import { ExperienceLevelSchema } from "@/schema";
import { $experienceLevel } from "@/stores/settings";
import { Loader2Icon } from "lucide-react";
import { ChefHat } from "lucide-react";
import { CookingPot } from "lucide-react";
import { Cookie } from "lucide-react";
import { useRouter } from "next/navigation";
import { MouseEventHandler, useState } from "react";

export default function Experience() {
  const router = useRouter();
  const send = useSend();
  const session$ = usePageSessionStore();
  const [selectedExperience, setSelectedExperience] = useState(
    session$.get().context.browserSessionSnapshot?.context.experienceLevel
  );
  const [showCTA, setShowCTA] = useState(!!selectedExperience);

  useEventHandler("PAGE_LOADED", () => {
    setShowCTA(true);
  });

  const handleCTA: MouseEventHandler<HTMLDivElement> = (event) => {
    const experience = ExperienceLevelSchema.parse(
      event.currentTarget.getAttribute("data-value")
    );
    assert(experience, "expected experience");
    setSelectedExperience(experience);
    $experienceLevel.set(experience);
    send({ type: "EXPERIENCE_CHANGE", experience });
    router.push("/quiz/taste");
  };

  const handleNext = () => {
    assert(selectedExperience, "expected experience to be selected");
    send({ type: "EXPERIENCE_CHANGE", experience: selectedExperience });
    router.push("/quiz/taste");
  };

  return (
    <div className="flex flex-col items-center justify-center">
      <h1 className="text-xl font-bold px-4 text-center text-balance">
        Describe your cooking experience
      </h1>
      <div className="flex flex-col gap-2 w-full p-4">
        {["beginner", "intermediate", "advanced"].map((level) => (
          <Card
            key={level}
            onClick={handleCTA}
            data-value={level}
            className={`w-full max-w-xl mx-auto p-5 items-center justify-start flex flex-row gap-3 cursor-pointer ${
              selectedExperience === level ? "border-2 border-blue-500" : ""
            }`}
          >
            {(
                level === "beginner" ? <Cookie size={32} /> :
                level === "intermediate" ? <CookingPot size={32} /> :
                <ChefHat size={32} />
            )}

            <div>
              <CardTitle>
                {level.charAt(0).toUpperCase() + level.slice(1)}
              </CardTitle>
              <CardDescription>
                {level === "beginner"
                  ? "I need guidance"
                  : level === "intermediate"
                  ? "I'm comfortable with many recipes"
                  : "I experiment with complex recipes"}
              </CardDescription>
            </div>
          </Card>
        ))}
      </div>
      {showCTA && (
        <div className="sticky bottom-0 w-full p-2 flex justify-center">
          <Button
            className="mt-6 font-bold py-2 px-4 rounded w-full mb-6 max-w-xl shadow-xl transitioning:opacity-50"
            onClick={handleNext}
          >
            <span className="transitioning:hidden">Next</span>
            <Loader2Icon className="transitioning:block hidden animate-spin" />
          </Button>
        </div>
      )}
    </div>
  );
}
