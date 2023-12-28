import { NextRequest, NextResponse } from "next/server";
import {
  createGuestToken,
  getGuestToken,
  setGuestTokenCookie,
} from "./lib/browser-session";

export async function middleware(request: NextRequest) {
  let guestToken = await getGuestToken();
  let guestId = guestToken?.jti;
  let newToken: string | undefined;
  if (!guestId) {
    const result = await createGuestToken();
    guestId = result.id;
    newToken = result.token;
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-guest-id", guestId);

  const res = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  if (newToken) {
    await setGuestTokenCookie(res, newToken);
  }

  return res;
}
