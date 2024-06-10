import { createContext } from "react";
import { AppActor } from "./app-machine";

export const AppContext = createContext({} as AppActor);
