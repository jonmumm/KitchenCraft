import { map } from "nanostores";
import { createContext } from "react";

export const RemixContext = createContext(
  map({
    open: false,
    slug: undefined as string | undefined,
    loading: false,
    submittedPrompt: undefined as string | undefined,
    prompt: "" as string,
  })
);
