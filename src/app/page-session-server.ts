import { createMachineServer } from "@/lib/actor-kit/createMachineServer";
import { AppEventSchema } from "@/schema";
import { createPageSessionMachine } from "./page-session-machine";

const SessionServer = createMachineServer(
  createPageSessionMachine,
  AppEventSchema
);

export default SessionServer;
