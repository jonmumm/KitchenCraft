import { sessionMachine } from "@/app/session-machine";
import { ActorRefFrom, SnapshotFrom } from "xstate";

export type SessionSnapshot = SnapshotFrom<ActorRefFrom<typeof sessionMachine>>; // todo make generic
