// components/ExperienceCard.tsx
import { Card, CardDescription, CardTitle } from "@/components/display/card";
import { Button } from "@/components/input/button";
import { useEventHandler } from "@/hooks/useEventHandler";
import { useSend } from "@/hooks/useSend";
import { usePageSessionStore } from "@/hooks/usePageSessionStore";
import { ExperienceLevel } from "@/types";
import React, { useState } from "react";

interface ExperienceCardProps {
  level: ExperienceLevel;
}

export const ExperienceCard: React.FC<ExperienceCardProps> = ({ level }) => {
  const send = useSend();
  const session = usePageSessionStore();

  // Fetch initial experience level from the session
  const [selected, setSelected] = useState(() => {
    const sessionExperience =
      session.get().context.browserSessionSnapshot?.context.experienceLevel;
    return sessionExperience === level;
  });

  useEventHandler("EXPERIENCE_CHANGE", (event) => {
    setSelected(event.experience === level);
  });

  const handleOnClick = () => {
    send({ type: "EXPERIENCE_CHANGE", experience: level });
    setSelected(true); // Mark as selected on click
  };

  return (
    <Card
      onClick={handleOnClick}
      className={`w-full max-w-xl mx-auto p-5 items-center justify-start flex flex-row gap-3 cursor-pointer ${
        selected ? "border-2 border-blue-500" : ""
      }`}
    >
      <Button size="icon" variant="outline">
        {level === "beginner" ? "👶" : level === "intermediate" ? "👨‍🍳" : "🧑‍🔬"}
      </Button>
      <div>
        <CardTitle>{level.charAt(0).toUpperCase() + level.slice(1)}</CardTitle>
        <CardDescription>
          {level === "beginner"
            ? "I need guidance"
            : level === "intermediate"
            ? "I'm comfortable with many recipes"
            : "I experiment with complex recipes"}
        </CardDescription>
      </div>
    </Card>
  );
};
