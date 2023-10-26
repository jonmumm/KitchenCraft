import { map } from "nanostores";
import { createContext } from "react";

export const RemixContext = createContext(
  map({
    prompt: "",
  })
);
