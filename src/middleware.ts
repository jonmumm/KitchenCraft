import { NextRequest, NextResponse } from "next/server";
import { ensureDeviceSession } from "./lib/device-session";

export async function middleware(request: NextRequest) {
  const res = NextResponse.next({
    request,
  });
  await ensureDeviceSession(res);
  return res;
}
