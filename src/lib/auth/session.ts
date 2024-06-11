import type { SessionMachine } from "@/app/session-machine";
import { getProfileByUserId } from "@/db/queries";
import { getServerSession } from "next-auth";
import { cache } from "react";
import { createActorHTTPClient } from "../actor-kit/createActorHTTPClient";
import { withSpan } from "../observability";
import { getGuestId, getUserId } from "../session";
import { authOptions } from "./options";
import { PageSessionMachine } from "@/app/page-session-machine";
import { UserMachine } from "@/app/user-machine";

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

export const getUserActorClient = withSpan(
  cache(async () => {
    return createActorHTTPClient<UserMachine, "user">({
      type: "user",
      caller: {
        id: getUserId(),
        type: "user",
      },
    });
  }),
  "getUserActorClient"
);

export const getSessionActorClient = withSpan(
  cache(async () => {
    return createActorHTTPClient<SessionMachine, "user">({
      type: "session",
      caller: {
        id: getUserId(),
        type: "user",
      },
    });
  }),
  "getSessionActorClient"
);

export const getPageSessionActorClient = withSpan(
  cache(async () => {
    return createActorHTTPClient<PageSessionMachine, "user">({
      type: "page_session",
      caller: {
        id: getUserId(),
        type: "user",
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
