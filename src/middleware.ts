import { NextRequest, NextResponse } from "next/server";
import {
  createCallerToken,
  getGuestTokenFromCookies,
  parseAppInstallToken,
  setGuestTokenCookieHeader,
} from "./lib/browser-session";
import { CallerSchema } from "./schema";

export async function middleware(request: NextRequest) {
  const appInstallToken = request.nextUrl.searchParams.get("token");

  let newGuestToken: string | undefined;
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

    if (!caller) {
      const id = uuidv4();
      const callerToken = await createCallerToken(id, "guest");
      newGuestToken = callerToken;
      uniqueId = id;
    } else {
      uniqueId = CallerSchema.parse(caller).uniqueId;
    }
  }

  // todo only do this if actually a guest?
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-guest-id", uniqueId);

  const res = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

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
