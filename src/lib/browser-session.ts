import { privateEnv } from "@/env.secrets";
import { serialize } from "cookie";
import { SignJWT, jwtVerify } from "jose";
import { nanoid } from "nanoid";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { assert } from "./utils";
import { getCurrentUserId } from "./auth/session";

export const GUEST_TOKEN_COOKIE_KEY = "guest-token";

interface UserJwtPayload {
  jti: string;
  iat: number;
}

function uuidv4() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    var r = (Math.random() * 16) | 0,
      v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export class AuthError extends Error {}

export const ensureGuestId = async (res: NextResponse) => {
  // const currentUsrId = await getCurrentUserId();
  const cookieStore = cookies();
  let deviceSessionToken = cookieStore.get(GUEST_TOKEN_COOKIE_KEY)?.value;

  if (!deviceSessionToken) {
    deviceSessionToken = await new SignJWT({})
      .setProtectedHeader({ alg: "HS256" })
      .setJti(uuidv4())
      .setIssuedAt()
      .setExpirationTime("30d")
      .sign(new TextEncoder().encode(privateEnv.NEXTAUTH_SECRET));

    const deviceSessionTokenStr = serialize(
      GUEST_TOKEN_COOKIE_KEY,
      deviceSessionToken
    );
    res.headers.append("set-cookie", deviceSessionTokenStr);
  }
};

export const getBrowserSessionPayload = async () => {
  const cookieStore = cookies();
  const deviceSessionToken = cookieStore.get(GUEST_TOKEN_COOKIE_KEY)?.value;
  assert(
    deviceSessionToken,
    "expected deviceSessionToken. ensureSessionStorageKey must not have been called in middlware"
  );

  try {
    const verified = await jwtVerify(
      deviceSessionToken,
      new TextEncoder().encode(privateEnv.NEXTAUTH_SECRET)
    );
    return verified.payload as UserJwtPayload;
  } catch (err) {
    throw new AuthError(
      "Your token has expired. todo: Implement token refresh"
    );
  }
};

export const getBrowserSessionId = async () => {
  return (await getBrowserSessionPayload()).jti;
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
