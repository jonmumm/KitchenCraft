import { getServerSession } from "next-auth";
import { authOptions } from "./options";

export const getSession = () => getServerSession(authOptions);

export const getUserId = async () => {
  const session = await getSession();
  return session?.user.id;
};
