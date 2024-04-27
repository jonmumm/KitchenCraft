import { createMachineServer } from "@/lib/actor-kit";
import { AppEventSchema } from "@/schema";
import { browserSessionMachine } from "./browser-session-machine";

const BrowserSessionServer = createMachineServer(browserSessionMachine, AppEventSchema);

export default BrowserSessionServer;
