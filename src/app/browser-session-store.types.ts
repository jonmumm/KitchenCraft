import { ActorRefFrom, SnapshotFrom } from "xstate";
import { browserSessionMachine } from "./browser-session-machine";

export type BrowserSessionSnapshot = SnapshotFrom<
  ActorRefFrom<typeof browserSessionMachine>
>;
