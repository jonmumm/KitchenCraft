"use client";

import { UserSnapshotConditionalRenderer } from "@/components/util/user-matches";
import { ReactNode } from "react";

export const IsOnboaridngInComplete = ({
  children,
}: {
  children: ReactNode;
}) => {
  return (
    <UserSnapshotConditionalRenderer
      matchedState={{ Onboarding: "Complete" }}
      not
    >
      {children}
    </UserSnapshotConditionalRenderer>
  );
};
