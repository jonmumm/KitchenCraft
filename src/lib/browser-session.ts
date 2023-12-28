import { privateEnv } from "@/env.secrets";
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
function uuidv4() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    var r = (Math.random() * 16) | 0,
      v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export class AuthError extends Error {}

export const GUEST_TOKEN_COOKIE_KEY = "guest-token";

export const createGuestToken = async () => {
  const id = uuidv4();
  const token = await new SignJWT({})
    .setProtectedHeader({ alg: "HS256" })
    .setJti(id)
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(new TextEncoder().encode(privateEnv.NEXTAUTH_SECRET));
  return { token, id };
};

export const setGuestTokenCookie = async (
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

export const getGuestToken = async () => {
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
    throw new AuthError(
      "Your token has expired. todo: Implement token refresh"
    );
  }
};

export const getGuestId = async () => {
  const headerList = headers();
  const guestId = headerList.get("x-guest-id");
  assert(guestId, "expected guestId");
  return guestId;
};

/**
 * Verifies the user's JWT token and returns its payload if it's valid.
 */
// export async function getSessionStorageKey(req: NextRequest) {
//   const token = req.cookies.get(DEVICE_SESSION_TOKEN)?.value;

//   if (!token) throw new AuthError("Missing user token");

//   try {
//     const verified = await jwtVerify(
//       token,
//       new TextEncoder().encode(privateEnv.NEXTAUTH_SECRET)
//     );
//     return verified.payload as UserJwtPayload;
//   } catch (err) {
//     throw new AuthError("Your token has expired.");
//   }
// }

/**
 * Adds the user token cookie to a response.
 */
// export async function setUserCookie(res: NextResponse) {
//   const token = await new SignJWT({})
//     .setProtectedHeader({ alg: "HS256" })
//     .setJti(nanoid())
//     .setIssuedAt()
//     .setExpirationTime("30d")
//     .sign(new TextEncoder().encode(privateEnv.NEXTAUTH_SECRET));

//   res.cookies.set(DEVICE_SESSION_TOKEN, token, {
//     httpOnly: true,
//     maxAge: 60 * 60 * 24 * 7 * 30, // 30 days
//   });

//   return res;
// }

/**
 * Expires the user token cookie
 */
// export function expireUserCookie(res: NextResponse) {
//   res.cookies.set(DEVICE_SESSION_TOKEN, "", { httpOnly: true, maxAge: 0 });
//   return res;
// }
