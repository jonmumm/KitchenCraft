import { createActorClient } from "@/lib/actor-kit";
import { userAppMachine } from "./app-machine.def";

export const userActorClient = createActorClient<typeof userAppMachine>();

// export const getUserServerActor = cache(userActorClient.get);
// export const getUserServerActorSnapshot = cache(userActorClient.getSnapshot);
