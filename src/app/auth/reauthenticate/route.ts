import { pageSessionMachine } from "@/app/page-session-machine";
import { createActorHTTPClient } from "@/lib/actor-kit";
import { getCurrentUserId } from "@/lib/auth/session";
import { verifyToken } from "@/lib/jwt-tokens";
import assert from "assert";
import { randomUUID } from "crypto";
import { redirect } from "next/navigation";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const callbackUrl = searchParams.get("callbackUrl");
  const connectionToken = searchParams.get("connectionToken");
  assert(connectionToken, "expected connectionToken");
  const result = await verifyToken(connectionToken);
  const pageSessionId = result.sub;
  const connectionId = result.jti;

  const userId = await getCurrentUserId();
  assert(userId, "expected userId");

  const client = createActorHTTPClient<typeof pageSessionMachine, "system">({
    type: "page_session",
    caller: {
      id: randomUUID(),
      type: "system",
    },
  });
  console.log([{ pageSessionId, connectionId }]);

  // todo, instead of sending this event to the page session
  // we want to send an event to the session
  // that way it can authenticate and then push it's
  // state back out to clients that are listening to it.
  // this will enable you to authenticat multiple page sessions
  // at once potentially

  // await client.send(pageSessionId, {
  //   type: "AUTHENTICATE",
  //   connectionId,
  //   userId,
  // });

  if (callbackUrl) {
    redirect(callbackUrl);
  }

  redirect("/");
}
