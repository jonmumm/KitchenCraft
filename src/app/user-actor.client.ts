import { createActorClient } from "@/lib/actor-kit";
import { cache } from "react";
import { userAppMachine } from "./user-app-machine.def";

const userActorClient = createActorClient<typeof userAppMachine>();

export const getUserServerActor = cache(userActorClient.get);
export const getUserServerActorSnapshot = cache(userActorClient.getSnapshot);
