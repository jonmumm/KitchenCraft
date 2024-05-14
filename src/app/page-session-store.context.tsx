import { WritableAtom } from "nanostores";
import { createContext } from "react";
import { PageSessionSnapshot } from "./page-session-machine";

export const PageSessionContext = createContext(
  {} as WritableAtom<PageSessionSnapshot>
);
