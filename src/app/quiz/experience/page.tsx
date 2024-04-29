"use client";

import { Card, CardDescription, CardTitle } from "@/components/display/card";
import { Button } from "@/components/input/button";
import { useRouter } from "next/navigation";
import { twc } from "react-twc";

export default function Experience() {
  const router = useRouter();

  // Navigate to the next page or submit the data
  const handleCTA = () => {
    // You might want to process the collected data here or move to another page
    router.push("/quiz/equipment");
  };

  return (
    <div className="flex flex-col items-center justify-center p-4">
      <h1 className="text-xl font-bold mb-4 text-center">
        How would you describe your cooking experience?
      </h1>
      <div className="space-y-2 w-full max-w-md"></div>

      <div className="flex flex-col gap-2 w-full">
        <ExperienceCard onClick={handleCTA}>
          <Button size="icon" variant="outline">
            👶
          </Button>
          <div>
            <CardTitle>Beginner</CardTitle>
            <CardDescription>I need guidance</CardDescription>
          </div>
        </ExperienceCard>
        <ExperienceCard onClick={handleCTA}>
          <Button size="icon" variant="outline">
            👨‍🍳
          </Button>
          <div>
            <CardTitle>Intermediate</CardTitle>
            <CardDescription>Comfortable with basic recipes</CardDescription>
          </div>
        </ExperienceCard>
        <ExperienceCard onClick={handleCTA}>
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
