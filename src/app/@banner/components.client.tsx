"use client";

import { PageSessionSnapshotConditionalRenderer } from "@/components/util/page-session-snapshot-conditiona.renderer";
import { ReactNode } from "react";

export const IsOnboaridngInComplete = ({
  children,
  initialValue,
}: {
  children: ReactNode;
  initialValue: boolean;
}) => {
  return (
    <PageSessionSnapshotConditionalRenderer
      selector={(state) =>
        state.context.browserSessionSnapshot?.value.Onboarding !== "Summary"
      }
      initialValueOverride={initialValue}
    >
      {children}
    </PageSessionSnapshotConditionalRenderer>
  );
};
