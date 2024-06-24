"use client";

import { UserMatches } from "@/components/util/user-matches";
import { ReactNode } from "react";

export const IsOnboaridngInComplete = ({
  children,
}: {
  children: ReactNode;
}) => {
  return (
    <UserMatches
      matchedState={{ Onboarding: "Complete" }}
      not
    >
      {children}
    </UserMatches>
  );
};
