import { createMachineServer } from "@/lib/actor-kit";
import { AppEventSchema } from "@/schema";
import { browserSessionMachine } from "./browser-session-machine";

const SessionServer = createMachineServer(browserSessionMachine, AppEventSchema);

export default SessionServer;
