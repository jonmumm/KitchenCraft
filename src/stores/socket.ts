import { atom } from "nanostores";
import PartySocket from "partysocket";

export const socket$ = atom<PartySocket | undefined>(undefined);
