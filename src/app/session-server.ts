import { createMachineServer } from "@/lib/actor-kit/createMachineServer";
import { AppEventSchema } from "@/schema";
import { createSessionMachine } from "./session-machine";

const SessionServer = createMachineServer(
  createSessionMachine,
  AppEventSchema,
  true
);

export default SessionServer;
