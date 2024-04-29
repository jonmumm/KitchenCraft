"use client";

import { Card, CardDescription, CardTitle } from "@/components/display/card";
import { Button } from "@/components/input/button";
import { useSend } from "@/hooks/useSend";
import { ExperienceLevelSchema } from "@/schema";
import { useRouter } from "next/navigation";
import { MouseEventHandler } from "react";
import { twc } from "react-twc";

export default function Experience() {
  const router = useRouter();
  const send = useSend();

  // Navigate to the next page or submit the data
  const handleCTA: MouseEventHandler<HTMLDivElement> = (event) => {
    const experience = ExperienceLevelSchema.parse(
      event.currentTarget.getAttribute("data-value")
    );
    send({ type: "EXPERIENCE_CHANGE", experience });

    // You might want to process the collected data here or move to another page
    router.push("/quiz/equipment");
  };

  return (
    <div className="flex flex-col items-center justify-center">
      <h1 className="text-xl font-bold px-4 text-center text-balance">
        Describe your cooking experience
      </h1>
      <div className="space-y-2 w-full max-w-md"></div>

      <div className="flex flex-col gap-2 w-full p-4">
        <ExperienceCard onClick={handleCTA} data-value="beginner">
          <Button size="icon" variant="outline">
            👶
          </Button>
          <div>
            <CardTitle>Beginner</CardTitle>
            <CardDescription>I need guidance</CardDescription>
          </div>
        </ExperienceCard>
        <ExperienceCard onClick={handleCTA} data-value="intermediate">
          <Button size="icon" variant="outline">
            👨‍🍳
          </Button>
          <div>
            <CardTitle>Intermediate</CardTitle>
            <CardDescription>Comfortable with basic recipes</CardDescription>
          </div>
        </ExperienceCard>
        <ExperienceCard onClick={handleCTA} data-value="advanced">
          <Button size="icon" variant="outline">
            🧑‍🔬
          </Button>
          <div>
            <CardTitle>Advanced</CardTitle>
            <CardDescription>I experiment with complex recipes</CardDescription>
          </div>
        </ExperienceCard>
      </div>
    </div>
  );
}

const ExperienceCard = twc(
  Card
)`w-full max-w-xl mx-auto p-5 items-center justify-start flex flex-row gap-3 cursor-pointer`;
