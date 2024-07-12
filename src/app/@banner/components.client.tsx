"use client";

import { UserMatches } from "@/components/util/user-matches";
import { ReactNode } from "react";

export const IsQuizInComplete = ({ children }: { children: ReactNode }) => {
  return (
    <UserMatches
      matchedState={{ Onboarding: "NotStarted" }}
      or={{ Onboarding: "Quiz" }}
    >
      {children}
    </UserMatches>
  );
};
