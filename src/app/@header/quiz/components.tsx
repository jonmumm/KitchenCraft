import React from "react";

type StepsIndicatorProps = {
  currentStep: "Experience" | "Equipment" | "Cuisines" | "Preferences" | "Results";
};

const steps = ["Experience", "Equipment", "Cuisines", "Preferences", "Results"];

const StepsIndicator: React.FC<StepsIndicatorProps> = ({ currentStep }) => {
  // Function to determine if the step should be highlighted as primary
  const isStepPrimary = (step: string) => {
    return steps.indexOf(step) <= steps.indexOf(currentStep);
  };

  return (
    <ul className="steps text-xs text-muted-foreground my-4">
      {steps.map((step) => (
        <li
          key={step}
          className={`step ${isStepPrimary(step) ? 'step-primary text-foreground font-semibold' : ''}`}
        >
          {step}
        </li>
      ))}
    </ul>
  );
};

export default StepsIndicator;
