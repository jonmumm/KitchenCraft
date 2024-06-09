import { ActorRefFrom, SnapshotFrom } from "xstate";
import { sessionMachine as sessionMachine } from "./session-machine";

export type SessionSnapshot = SnapshotFrom<
  ActorRefFrom<typeof sessionMachine>
>;
