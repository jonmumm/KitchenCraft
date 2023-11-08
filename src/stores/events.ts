import { AppEvent } from "@/types";
import { atom } from "nanostores";

export const event$ = atom<AppEvent>({ type: "INIT" });
