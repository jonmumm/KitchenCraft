import { NextRequest, NextResponse } from "next/server";

// todo this middleware should take in an id and type for an actor, get the snapshot of it, and forward it as a header
export const actorKitNextJSMiddleware: (
  request: NextRequest,
  id: string,
  type: string,
  distinctId: string
) => NextResponse = (request) => {
  const requestHeaders = new Headers(request.headers);

  requestHeaders.set("x-url", request.url);
  requestHeaders.set(
    "x-actorkit-id",
    request.headers.get("x-vercel-ip-timezone") || "America/Los_Angeles"
  );

  const res = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
  return res;
};
