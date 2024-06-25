import { ExtraAppProps } from "@/types";
import { MapStore } from "nanostores";
import { createContext } from "react";

export const GlobalContext = createContext(
  {} as MapStore<
    ExtraAppProps & {
      [key: string]: unknown;
    }
  >
);
