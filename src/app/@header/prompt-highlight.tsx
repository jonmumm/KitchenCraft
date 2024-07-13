"use client";

import { Highlight } from "@/components/highlight";
// import { PageSessionSelectorLink } from "@/components/util/page-session-selector-link";
// import { selectCurrentSaveToListPath } from "@/selectors/page-session.selectors";
import { useUserMatchesState } from "@/hooks/useUserMatchesState";
import { ReactNode } from "react";

export const PromptHighlight = ({ children }: { children: ReactNode }) => {
  const shouldHighlightPrompt = useUserMatchesState({ Onboarding: "Prompt" });
  console.log({ shouldHighlightPrompt });
  return <Highlight open={shouldHighlightPrompt}>{children}</Highlight>;
};
