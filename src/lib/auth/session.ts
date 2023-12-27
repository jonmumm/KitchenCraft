import { cache } from "react";
import { getServerSession } from "next-auth";
import { authOptions } from "./options";
import { withSpan } from "../observability";

export const getSession = withSpan(
  cache(async () => {
    return await getServerSession(authOptions);
  }),
  "getSession"
);

export const getCurrentUserId = withSpan(
  cache(async () => {
    const session = await getSession();
    return session?.user.id;
  }),
  "getCurrentUserId"
);
