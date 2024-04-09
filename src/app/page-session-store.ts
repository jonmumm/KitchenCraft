import { pageSessionMachine } from "@/app/page-session-machine";
import { ActorRefFrom, SnapshotFrom } from "xstate";

export type SessionSnapshot = SnapshotFrom<ActorRefFrom<typeof pageSessionMachine>>; // todo make generic
