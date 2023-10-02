import { prompt$ } from "@/stores/prompt";
import { createContext } from "react";

export const PromptContext = createContext(prompt$);
