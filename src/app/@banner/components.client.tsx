"use client";

import { SessionSnapshotConditionalRenderer } from "@/components/util/session-snapshot-conditional-renderer";
import { ReactNode } from "react";

export const IsOnboaridngInComplete = ({
  children,
}: {
  children: ReactNode;
}) => {
  return (
    <SessionSnapshotConditionalRenderer
      matchedState={{ Onboarding: "Complete" }}
      not
    >
      {children}
    </SessionSnapshotConditionalRenderer>
  );
};
