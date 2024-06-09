import { createCallerToken } from "@/lib/session";
import { assert } from "@/lib/utils";
import { Caller } from "@/types";
import { jwtVerify } from "jose";
import type * as Party from "partykit/server";
import { fromPromise } from "xstate";

export const initializeSessionSocket = fromPromise(
  async ({
    input,
  }: {
    input: {
      refreshToken: string;
      caller: Caller;
      partyContext: Party.Context;
    };
  }) => {
    const sessionId = (await parseRefreshToken(input.refreshToken)).payload.jti;
    assert(sessionId, "expected session id in refresh token");
    const token = await createCallerToken(input.caller.id, input.caller.type);
    const socket = await input.partyContext.parties
      .session!.get(sessionId)
      .socket({
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    return socket;
  }
);

const parseRefreshToken = async (token: string) => {
  const verified = await jwtVerify(
    token,
    new TextEncoder().encode(process.env.NEXTAUTH_SECRET)
  );
  assert(verified.payload.jti, "expected JTI on Access Token");
  return verified;
};
