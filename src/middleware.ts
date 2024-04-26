import { NextRequest, NextResponse } from "next/server";
import {
  createBrowserSessionToken,
  createCallerToken,
  getBrowserSessionTokenFromCookie,
  getGuestTokenFromCookies,
  parseAppInstallToken,
  parsedBrowserSessionTokenFromCookie,
  setGuestTokenCookieHeader,
  setSessionTokenCookieHeader
} from "./lib/browser-session";
import { CallerSchema } from "./schema";

export async function middleware(request: NextRequest) {
  const appInstallToken = request.nextUrl.searchParams.get("token");

  let newGuestToken: string | undefined;
  let newBrowserSessionToken: string | undefined;
  let uniqueId;
  // let uniqueIdType: UniqueIdType | undefined;
  if (appInstallToken) {
    let appInstall;
    try {
      appInstall = await parseAppInstallToken(appInstallToken);
    } catch (ex) {
      // If expired, do nothing
    }
    if (appInstall && !appInstall.email && appInstall.distinctId) {
      uniqueId = appInstall.distinctId;
      newGuestToken = await createCallerToken(appInstall.distinctId, "guest");
    }
  }

  if (!uniqueId) {
    const guestToken = await getGuestTokenFromCookies();
    let caller = guestToken?.jti;

    if (caller) {
      const callerParse = CallerSchema.safeParse(caller);
      if (callerParse.success && callerParse.data.uniqueIdType === "guest") {
        uniqueId = callerParse.data.uniqueId;
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

  const browserSessionToken = await getBrowserSessionTokenFromCookie();
  const parsedBrowserSessionToken =
    await parsedBrowserSessionTokenFromCookie();
  if (browserSessionToken && parsedBrowserSessionToken) {
    requestHeaders.set("x-browser-session-token", browserSessionToken);
  } else {
    newBrowserSessionToken = await createBrowserSessionToken(uuidv4());
    requestHeaders.set("x-browser-session-token", newBrowserSessionToken);
  }

  const pageSessionId = uuidv4();

  // todo only do this if actually a guest?
  requestHeaders.set("x-guest-id", uniqueId);
  requestHeaders.set("x-page-session-id", pageSessionId);
  requestHeaders.set("x-url", request.url);

  const res = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  if (newBrowserSessionToken) {
    await setSessionTokenCookieHeader(res, newBrowserSessionToken);
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
