import { createMachineServer } from "@/lib/actor-kit/createMachineServer";
import { AppEventSchema } from "@/schema";
import { createUserMachine } from "./user-machine";

const UserServer = createMachineServer(createUserMachine, AppEventSchema, true);

export default UserServer;
