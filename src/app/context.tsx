import { createContext } from "react";
import { AppActor } from "./machine";

export const AppContext = createContext({} as AppActor);
