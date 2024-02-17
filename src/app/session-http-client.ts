import { createActorHTTPClient } from "@/lib/actor-kit";
import { sessionMachine } from "./session-machine";

export const sessionActorClient =
  createActorHTTPClient<typeof sessionMachine>("session");
