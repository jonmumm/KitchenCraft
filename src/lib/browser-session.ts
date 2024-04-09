import { privateEnv } from "@/env.secrets";
import { CallerSchema } from "@/schema";
import { CallerType } from "@/types";
import { serialize } from "cookie";
import { SignJWT, jwtVerify } from "jose";
import { cookies, headers } from "next/headers";
import { NextResponse } from "next/server";
import { assert } from "./utils";

interface UserJwtPayload {
  jti: string;
  iat: number;
}

// todo find something better that works on edge functions

export class AuthError extends Error {}

export const GUEST_TOKEN_COOKIE_KEY = "guest-token";

export const createCallerToken = async (uniqueId: string, type: CallerType) => {
  const callerId = `${type}-${uniqueId}`;
  CallerSchema.parse(callerId);
  const token = await new SignJWT({})
    .setProtectedHeader({ alg: "HS256" })
    .setJti(callerId)
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(new TextEncoder().encode(privateEnv.NEXTAUTH_SECRET));
  return token;
};

export const parseCallerIdToken = async (token: string) => {
  const verified = await jwtVerify(
    token,
    new TextEncoder().encode(privateEnv.NEXTAUTH_SECRET)
  );
  assert(verified.payload.jti, "expected JTI on appInstallToken");
  return CallerSchema.parse(verified.payload.jti);
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

export const setGuestTokenCookieHeader = async (
  res: NextResponse,
  guestToken: string
) => {
  const guestTokenStr = serialize(GUEST_TOKEN_COOKIE_KEY, guestToken, {
    path: "/",
    maxAge: 60 * 60 * 24 * 60, // 60 days
  });
  res.headers.append("set-cookie", guestTokenStr);
};

export const verifyToken = async (token: string) => {
  const verified = await jwtVerify(
    token,
    new TextEncoder().encode(privateEnv.NEXTAUTH_SECRET)
  );
  return verified.payload as UserJwtPayload;
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

export const getPageSessionId = () => {
  const headerList = headers();
  const pageSessionId = headerList.get("x-page-session-id");
  assert(pageSessionId, "expected x-page-session-id in header");
  return pageSessionId;
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
