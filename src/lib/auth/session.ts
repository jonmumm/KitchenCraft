import { getProfileByUserId } from "@/db/queries";
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

export const getCurrentEmail = withSpan(
  cache(async () => {
    const session = await getSession();
    return !!session?.user.email ? session?.user.email : undefined;
  }),
  "withCurrentEmail"
);

export const getCurrentProfile = withSpan(
  cache(async () => {
    const userId = await getCurrentUserId();
    if (userId) {
      return await getProfileByUserId(userId);
    }
  }),
  "withCurrentEmail"
);
