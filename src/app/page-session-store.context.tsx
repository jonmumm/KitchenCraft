import { WritableAtom } from "nanostores";
import { createContext } from "react";
import { ActorRefFrom, SnapshotFrom } from "xstate";
import { pageSessionMachine } from "./page-session-machine";

export type PageSessionSnapshot = SnapshotFrom<
  ActorRefFrom<typeof pageSessionMachine>
>; // todo make generic

export const PageSessionContext = createContext(
  {} as WritableAtom<PageSessionSnapshot>
);
