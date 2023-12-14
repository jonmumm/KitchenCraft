import { privateEnv } from "@/env.secrets";
import { SignJWT, jwtVerify } from "jose";
import { nanoid } from "nanoid";
import { cookies } from "next/headers";
import { assert } from "./utils";
import { serialize } from "cookie";
import { NextResponse } from "next/server";

export const DEVICE_SESSION_TOKEN = "device-session";

interface UserJwtPayload {
  jti: string;
  iat: number;
}

export class AuthError extends Error {}

export const ensureDeviceSession = async (res: NextResponse) => {
  const cookieStore = cookies();
  let deviceSessionToken = cookieStore.get(DEVICE_SESSION_TOKEN)?.value;

  if (!deviceSessionToken) {
    deviceSessionToken = await new SignJWT({})
      .setProtectedHeader({ alg: "HS256" })
      .setJti(nanoid())
      .setIssuedAt()
      .setExpirationTime("30d")
      .sign(new TextEncoder().encode(privateEnv.NEXTAUTH_SECRET));

    const deviceSessionTokenStr = serialize(
      DEVICE_SESSION_TOKEN,
      deviceSessionToken
    );
    res.headers.append("set-cookie", deviceSessionTokenStr);
  }
};

// export const getDeviceSessionToken = async () => {
//   return cookies().get(DEVICE_SESSION_TOKEN)?.value;
// };

export const getDeviceSessionPayload = async () => {
  const cookieStore = cookies();
  const deviceSessionToken = cookieStore.get(DEVICE_SESSION_TOKEN)?.value;
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

export const getDeviceSessionId = async () => {
  return (await getDeviceSessionPayload()).jti;
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
