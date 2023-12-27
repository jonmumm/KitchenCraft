import { getServerSession } from "next-auth";
import { authOptions } from "./options";
import { withSpan } from "../observability";

export const getSession = withSpan(
  () => getServerSession(authOptions),
  "getSession"
);

export const getCurrentUserId = withSpan(async () => {
  const session = await getSession();
  return session?.user.id;
}, "getCurrentUserId");
