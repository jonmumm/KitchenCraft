import { MapStore } from "nanostores";
import { createContext } from "react";

export const ApplicationContext = createContext({} as MapStore<any>);
