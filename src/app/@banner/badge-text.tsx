"use client";

import { useUserMatchesState } from "@/hooks/useUserMatchesState";
import { useState } from "react";

export const BadgeText = () => {
  const initialValue = useUserMatchesState({ Onboarding: "NotStarted" });
  const [isNotStarted] = useState(initialValue);

  return isNotStarted ? <>Start</> : <>Resume</>;
};
