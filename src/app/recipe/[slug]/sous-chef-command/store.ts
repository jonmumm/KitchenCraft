import { map } from "nanostores";
import { ReactNode } from "react";

export const store = map({
  loading: false,
  prompt: undefined as string | undefined,
  submittedPrompt: undefined as string | undefined,
  data: undefined as string | undefined,
  resultsComponent: undefined as ReactNode | undefined,
});
