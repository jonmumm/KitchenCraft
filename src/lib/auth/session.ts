import { pageSessionMachine } from "@/app/page-session-machine";
import { sessionMachine } from "@/app/session-machine";
import { getProfileByUserId } from "@/db/queries";
import { getServerSession } from "next-auth";
import { cache } from "react";
import { createActorHTTPClient } from "../actor-kit";
import { withSpan } from "../observability";
import { getGuestId } from "../session";
import { authOptions } from "./options";

export const getNextAuthSession = withSpan(
  cache(async () => {
    return await getServerSession(authOptions);
  }),
  "getNextAuthSession"
);

export const getCurrentUserId = withSpan(
  cache(async () => {
    const session = await getNextAuthSession();
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

export const getSessionActorClient = withSpan(
  cache(async () => {
    const uniqueId = await getUniqueId();
    const uniqueIdType = await getUniqueIdType();

    return createActorHTTPClient<typeof sessionMachine, typeof uniqueIdType>({
      type: "session",
      caller: {
        id: uniqueId,
        type: uniqueIdType,
      },
    });
  }),
  "getSessionActorClient"
);

export const getPageSessionActorClient = withSpan(
  cache(async () => {
    const uniqueId = await getUniqueId();
    const uniqueIdType = await getUniqueIdType();

    return createActorHTTPClient<
      typeof pageSessionMachine,
      typeof uniqueIdType
    >({
      type: "page_session",
      caller: {
        id: uniqueId,
        type: uniqueIdType,
      },
    });
  }),
  "getPageSessionActorClient"
);

export const getCurrentEmail = withSpan(
  cache(async () => {
    const session = await getNextAuthSession();
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
