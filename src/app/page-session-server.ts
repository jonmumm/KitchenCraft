import { createMachineServer } from "@/lib/actor-kit";
import { AppEventSchema } from "@/schema";
import { pageSessionMachine } from "./page-session-machine";

const SessionServer = createMachineServer(pageSessionMachine, AppEventSchema);

export default SessionServer;
