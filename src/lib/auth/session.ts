import { getServerSession } from "next-auth";
import { cache } from "react";
import { getGuestId } from "../browser-session";
import { withSpan } from "../observability";
import { authOptions } from "./options";

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

export const getDistinctId = withSpan(
  cache(async () => {
    const userId = await getCurrentUserId();
    const guestId = await getGuestId();
    return userId || guestId;
  }),
  "getDistinctId"
);
