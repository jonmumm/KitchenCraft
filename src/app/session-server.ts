import { createMachineServer } from "@/lib/actor-kit";
import { AppEventSchema } from "@/schema";
import { sessionMachine } from "./session-machine";

const SessionServer = createMachineServer(sessionMachine, AppEventSchema);

export default SessionServer;
