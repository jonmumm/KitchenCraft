import { NextRequest, NextResponse } from "next/server";
import { ensureGuestId } from "./lib/browser-session";

export async function middleware(request: NextRequest) {
  const res = NextResponse.next({
    request,
  });
  await ensureGuestId(res);
  return res;
}
