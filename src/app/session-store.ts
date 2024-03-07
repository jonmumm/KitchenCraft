import { sessionMachine } from "@/app/session-machine";
import { atom } from "nanostores";
import { ActorRefFrom, SnapshotFrom } from "xstate";

export type SessionSnapshot = SnapshotFrom<ActorRefFrom<typeof sessionMachine>>; // todo make generic
export const session$ = atom({} as SessionSnapshot);
