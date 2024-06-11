import { ActorRefFrom, SnapshotFrom } from "xstate";
import type { SessionMachine } from "./session-machine";

export type SessionSnapshot = SnapshotFrom<ActorRefFrom<SessionMachine>>;
