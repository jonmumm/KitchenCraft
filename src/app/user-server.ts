import { createMachineServer } from "@/lib/actor-kit";
import { AppEventSchema } from "@/schema";
import { userMachine } from "./user-machine";

const UserServer = createMachineServer(userMachine, AppEventSchema);

export default UserServer;
