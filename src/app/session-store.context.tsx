import { WritableAtom } from "nanostores";
import { createContext } from "react";
import { ActorRefFrom, SnapshotFrom } from "xstate";
import { sessionMachine } from "./session-machine";

export type SessionStoreSnapshot = SnapshotFrom<
  ActorRefFrom<typeof sessionMachine>
>; // todo make generic

export const SessionStoreContext = createContext(
  {} as WritableAtom<SessionStoreSnapshot>
);
