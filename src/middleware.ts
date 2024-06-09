import { NextRequest, NextResponse } from "next/server";
import {
  createCallerToken,
  createRefreshToken,
  getGuestTokenFromCookies,
  getRefreshTokenFromCookie,
  parsedSessionTokenFromCookie,
  setGuestTokenCookieHeader,
  setSessionTokenCookieHeader,
} from "./lib/session";
import { CallerSchema } from "./schema";

export async function middleware(request: NextRequest) {
  let newGuestToken: string | undefined;
  let newRefreshTOken: string | undefined;
  let uniqueId;

  // const appInstallToken = request.nextUrl.searchParams.get("token");
  // if (appInstallToken) {
  //   let appInstall;
  //   try {
  //     appInstall = await parseAppInstallToken(appInstallToken);
  //   } catch (ex) {
  //     // If expired, do nothing
  //   }
  //   if (appInstall && !appInstall.email && appInstall.distinctId) {
  //     uniqueId = appInstall.distinctId;
  //     newGuestToken = await createCallerToken(appInstall.distinctId, "guest");
  //   }
  // }

  if (!uniqueId) {
    const guestToken = await getGuestTokenFromCookies();
    let caller = guestToken?.jti;

    if (caller) {
      const callerParse = CallerSchema.safeParse(caller);
      if (callerParse.success && callerParse.data.type === "guest") {
        uniqueId = callerParse.data.id;
      }
    }

    if (!uniqueId) {
      const id = uuidv4();
      const callerToken = await createCallerToken(id, "guest");
      newGuestToken = callerToken;
      uniqueId = id;
    }
  }

  const requestHeaders = new Headers(request.headers);

  const refreshToken = await getRefreshTokenFromCookie();
  const parsedSessionToken = await parsedSessionTokenFromCookie();
  if (refreshToken && parsedSessionToken) {
    requestHeaders.set("x-session-id", parsedSessionToken.jti);
    requestHeaders.set("x-refresh-token", refreshToken);
  } else {
    const sessionId = uuidv4();
    newRefreshTOken = await createRefreshToken(sessionId);
    requestHeaders.set("x-session-id", sessionId);
    requestHeaders.set("x-refresh-token", newRefreshTOken);
  }

  const pageSessionId = uuidv4();

  // todo only do this if actually a guest?
  requestHeaders.set("x-guest-id", uniqueId);
  requestHeaders.set("x-page-session-id", pageSessionId);
  requestHeaders.set("x-url", request.url);
  requestHeaders.set(
    "x-timezone",
    request.headers.get("x-vercel-ip-timezone") || "America/Los_Angeles"
  );

  const res = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  if (newRefreshTOken) {
    await setSessionTokenCookieHeader(res, newRefreshTOken);
  }

  if (newGuestToken) {
    await setGuestTokenCookieHeader(res, newGuestToken);
  }

  return res;
}

function uuidv4() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    var r = (Math.random() * 16) | 0,
      v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
