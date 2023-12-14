import { getServerSession } from "next-auth";
import { authOptions } from "./options";

export const getSession = () => getServerSession(authOptions);
