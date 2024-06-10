import { privateEnv } from "@/env.secrets";
import { CallerSchema } from "@/schema";
import { CallerType } from "@/types";
import { serialize } from "cookie";
import { SignJWT, jwtVerify } from "jose";
import { cookies, headers } from "next/headers";
import { NextResponse } from "next/server";
import { UserJwtPayload } from "./jwt-tokens";
import { assert } from "./utils";

// todo find something better that works on edge functions

export class AuthError extends Error {}

export const GUEST_TOKEN_COOKIE_KEY = "guest-token";
export const REFRESH_TOKEN_COOKEY_KEY = "refresh-token";

export const createRefreshToken = async (sessionId: string, userId: string) => {
  const token = await new SignJWT({})
    .setProtectedHeader({ alg: "HS256" })
    .setJti(sessionId)
    .setSubject(userId)
    .setExpirationTime("90d")
    .sign(new TextEncoder().encode(privateEnv.NEXTAUTH_SECRET));
  return token;
};

export const parseRefreshTokenForUserId = async (refreshToken: string) => {
  const verified = await jwtVerify(
    refreshToken,
    new TextEncoder().encode(privateEnv.NEXTAUTH_SECRET)
  );
  assert(verified.payload.sub, "expected userId to be on accessToken as sub");
  return verified.payload.sub;
};

export const parseRefreshTokenForSessionId = async (refreshToken: string) => {
  const verified = await jwtVerify(
    refreshToken,
    new TextEncoder().encode(privateEnv.NEXTAUTH_SECRET)
  );
  assert(verified.payload.jti, "expected JTI on accessToken");
  return verified.payload.jti;
};

export const createAccessToken = async ({
  actorId,
  callerId,
  callerType,
  type,
}: {
  actorId: string;
  callerId: string;
  callerType: CallerType;
  type: "page_session" | "session" | "user";
}) => {
  const subject = `${callerType}-${callerId}`;
  CallerSchema.parse(subject);
  const token = await new SignJWT({})
    .setProtectedHeader({ alg: "HS256" })
    .setJti(actorId)
    .setSubject(subject)
    .setAudience(type)
    .setExpirationTime("30d")
    .sign(new TextEncoder().encode(privateEnv.NEXTAUTH_SECRET));
  return token;
};

export const parseAccessTokenForCaller = async ({
  accessToken,
  type,
  id,
}: {
  accessToken: string;
  type: string;
  id: string;
}) => {
  const verified = await jwtVerify(
    accessToken,
    new TextEncoder().encode(privateEnv.NEXTAUTH_SECRET)
  );
  assert(verified.payload.jti, "expected JTI on accessToken");
  assert(
    verified.payload.jti === id,
    "expected JTI on accessToken to match actor id: " + id
  );
  assert(
    verified.payload.aud,
    "expected accessToken audience to match actor type: " + type
  );
  assert(verified.payload.sub, "expected accessToken to have subject");
  return CallerSchema.parse(verified.payload.sub);
};

export const createAppInstallToken = async (
  distinctId: string,
  email?: string
) => {
  let signJWT = new SignJWT({})
    .setProtectedHeader({ alg: "HS256" })
    .setJti(distinctId)
    .setIssuedAt()
    .setExpirationTime("5m");
  if (email) {
    signJWT = signJWT.setSubject(email);
  }

  const token = await signJWT.sign(
    new TextEncoder().encode(privateEnv.NEXTAUTH_SECRET)
  );
  return token;
};

export const parseAppInstallToken = async (token: string) => {
  const verified = await jwtVerify(
    token,
    new TextEncoder().encode(privateEnv.NEXTAUTH_SECRET)
  );
  assert(verified.payload.jti, "expected JTI on appInstallToken");
  const sub = verified.payload.sub;
  return { email: sub, distinctId: verified.payload.jti };
};

export const setRefreshTokenCookieHeader = async (
  res: NextResponse,
  token: string
) => {
  const date = new Date();
  date.setFullYear(date.getFullYear() + 20); // Expires 20 years from now
  const tokenStr = serialize(REFRESH_TOKEN_COOKEY_KEY, token, {
    path: "/",
    expires: date,
    secure: true,
    httpOnly: true,
  });

  res.headers.append("set-cookie", tokenStr);
};

export const setGuestTokenCookieHeader = async (
  res: NextResponse,
  guestToken: string
) => {
  const guestTokenStr = serialize(GUEST_TOKEN_COOKIE_KEY, guestToken, {
    path: "/",
    maxAge: 60 * 60 * 24 * 60, // 60 days
    secure: true,
    httpOnly: true,
  });
  res.headers.append("set-cookie", guestTokenStr);
};

export const getGuestTokenFromCookies = async () => {
  const cookieStore = cookies();
  const guestToken = cookieStore.get(GUEST_TOKEN_COOKIE_KEY)?.value;

  if (!guestToken) {
    return undefined;
  }

  try {
    const verified = await jwtVerify(
      guestToken,
      new TextEncoder().encode(privateEnv.NEXTAUTH_SECRET)
    );
    return verified.payload as UserJwtPayload;
  } catch (err) {
    return undefined;
    // A new one will be created
    // Probably expired...
  }
};

export const parsedSessionTokenFromCookie = async () => {
  const cookieStore = cookies();
  const sessionToken = cookieStore.get(REFRESH_TOKEN_COOKEY_KEY)?.value;

  if (!sessionToken) {
    return undefined;
  }

  try {
    const verified = await jwtVerify(
      sessionToken,
      new TextEncoder().encode(privateEnv.NEXTAUTH_SECRET)
    );
    return verified.payload as UserJwtPayload;
  } catch (err) {
    return undefined;
    // A new one will be created
    // Probably expired...
  }
};

export const getRefreshTokenFromCookie = () => {
  const cookieStore = cookies();
  const refreshToken = cookieStore.get(REFRESH_TOKEN_COOKEY_KEY)?.value;
  return refreshToken;
};

export const getRefreshToken = () => {
  const refreshTokenFromCookies = getRefreshTokenFromCookie();
  if (refreshTokenFromCookies) {
    return refreshTokenFromCookies;
  }

  const headerList = headers();
  const refreshToken = headerList.get("x-refresh-token");
  assert(
    refreshToken,
    "expected x-refresh-token in header but wasn't in cookies or header."
  );
  return refreshToken;
};

export const getPageSessionId = () => {
  const headerList = headers();
  const pageSessionId = headerList.get("x-page-session-id");
  assert(pageSessionId, "expected x-page-session-id in header");
  return pageSessionId;
};

export const getUserId = () => {
  const headerList = headers();
  const userId = headerList.get("x-user-id");
  assert(userId, "expected x-user-id in header");
  return userId;
};

export const getSessionId = () => {
  const headerList = headers();
  const sessionId = headerList.get("x-session-id");
  assert(sessionId, "expected x-session-id in header");
  return sessionId;
};

export const getRequestUrl = () => {
  const headerList = headers();
  const url = headerList.get("x-url");
  assert(url, "expected x-url in header");
  return url;
};

export const getSearchParams = () => {
  const url = getRequestUrl();
  const search = url.split("?")[1] || "";
  return new URLSearchParams(search);
};

export const getGuestId = async () => {
  const headerList = headers();
  const guestId = headerList.get("x-guest-id");
  assert(guestId, "expected x-guest-id in header");
  return guestId;
};
