import { createMachineServer } from "@/lib/actor-kit";
import { AppEventSchema } from "@/schema";
import { userAppMachine } from "./app-machine.def";

const ActorServer = createMachineServer(userAppMachine, AppEventSchema);

export default ActorServer;
