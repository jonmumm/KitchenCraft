import { NextRequest, NextResponse } from "next/server";
import {
  createGuestToken,
  getGuestToken,
  parseAppInstallToken,
  setGuestTokenCookieHeader,
} from "./lib/browser-session";

export async function middleware(request: NextRequest) {
  const appInstallToken = request.nextUrl.searchParams.get("token");

  let newGuestToken: string | undefined;
  let guestId;
  if (appInstallToken) {
    let appInstall;
    try {
      appInstall = await parseAppInstallToken(appInstallToken);
    } catch (ex) {
      // If expired, do nothing
    }
    if (appInstall && !appInstall.email && appInstall.distinctId) {
      guestId = appInstall.distinctId;
      newGuestToken = (await createGuestToken(appInstall.distinctId)).token;
    }
  }

  if (!guestId) {
    let guestToken = await getGuestToken();
    guestId = guestToken?.jti;
    if (!guestId) {
      const result = await createGuestToken();
      guestId = result.id;
      newGuestToken = result.token;
    }
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-guest-id", guestId);

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
