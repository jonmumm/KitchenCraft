import { getSessionActorClient } from "@/lib/auth/session";
import {
  REFRESH_TOKEN_COOKEY_KEY,
  createRefreshToken,
  getSessionId,
  getUserId,
} from "@/lib/session";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  // cookies().delete(REFRESH_TOKEN_COOKIEY_KEY);
  const sessionActorClient = await getSessionActorClient();
  const sessionId = await getSessionId();
  const userId = getUserId();
  const { snapshot } = await sessionActorClient.get(sessionId, {});

  const newUserId = snapshot.context.userId;

  if (userId === newUserId) {
    console.warn("called sign in but user ids already match");
  }

  const newRefreshToken = await createRefreshToken(sessionId, newUserId);

  const expiresDate = new Date();
  expiresDate.setFullYear(expiresDate.getFullYear() + 20); // Expires 20 years from now

  cookies().set(REFRESH_TOKEN_COOKEY_KEY, newRefreshToken, {
    path: "/",
    secure: true,
    httpOnly: true,
    expires: expiresDate,
  });

  const callbackUrl = request.nextUrl.searchParams.get("callbackUrl");
  callbackUrl ? redirect(callbackUrl) : redirect("/");
}
