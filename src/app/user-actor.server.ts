import { createMachineServer } from "@/lib/actor-kit";
import { AppEventSchema } from "@/schema";
import { userAppMachine } from "./user-app-machine.def";

const ActorServer = createMachineServer(userAppMachine, AppEventSchema);

export default ActorServer;
