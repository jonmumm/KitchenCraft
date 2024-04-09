import { pageSessionMachine } from "@/app/page-session-machine";
import { getProfileByUserId } from "@/db/queries";
import { getServerSession } from "next-auth";
import { cache } from "react";
import { createActorHTTPClient } from "../actor-kit";
import { getGuestId, getRequestUrl } from "../browser-session";
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

export const getUniqueId = withSpan(
  cache(async () => {
    const userId = await getCurrentUserId();
    const guestId = await getGuestId();
    return userId || guestId;
  }),
  "getUniqueId"
);

export const getUniqueIdType = withSpan(
  cache(async () => {
    const userId = await getCurrentUserId();
    return userId ? ("user" as const) : ("guest" as const);
  }),
  "getUniqueId"
);

export const getPageSessionActorClient = withSpan(
  cache(async () => {
    const uniqueId = await getUniqueId();
    const uniqueIdType = await getUniqueIdType();
    const url = getRequestUrl();

    return createActorHTTPClient<typeof pageSessionMachine>({
      type: "page_session",
      caller: {
        id: uniqueId,
        type: uniqueIdType,
      },
      input: { url },
    });
  }),
  "getPageSessionActorClient"
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
