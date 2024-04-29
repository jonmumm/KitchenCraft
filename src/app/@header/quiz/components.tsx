import { Separator } from "@/components/display/separator";
import React from "react";

type StepsIndicatorProps = {
  currentStep?: "Experience" | "Equipment" | "Diet" | "Preferences";
};

const steps = ["Experience", "Equipment", "Diet", "Preferences"];

const StepsIndicator: React.FC<StepsIndicatorProps> = ({ currentStep }) => {
  // Function to determine if the step should be highlighted
  const isStepPastOrDone = (step: string) => {
    return currentStep && steps.indexOf(step) <= steps.indexOf(currentStep);
  };

  return (
    <>
      <ul className="steps text-xs text-muted-foreground my-4">
        {steps.map((step) => (
          <li
            key={step}
            className={`step ${
              isStepPastOrDone(step)
                ? "step-neutral text-foreground font-semibold"
                : ""
            }`}
          >
            {step}
          </li>
        ))}
      </ul>
      <Separator className="mb-4" />
    </>
  );
};

export default StepsIndicator;
