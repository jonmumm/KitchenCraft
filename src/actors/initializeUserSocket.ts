import { assert } from "@/lib/utils";
import { Caller } from "@/types";
import { jwtVerify } from "jose";
import type * as Party from "partykit/server";
import { fromPromise } from "xstate";

export const initializeUserSocket = fromPromise(
  async ({
    input,
  }: {
    input: {
      userAccessToken: string;
      caller: Caller;
      partyContext: Party.Context;
    };
  }) => {
    const userId = (await parseUserAccessTokenForId(input.userAccessToken))
      .payload.jti;
    assert(userId, "expected session id in session token");
    const socket = await input.partyContext.parties.user!.get(userId).socket({
      headers: {
        Authorization: `Bearer ${input.userAccessToken}`,
      },
    });
    return socket;
  }
);

const parseUserAccessTokenForId = async (token: string) => {
  const verified = await jwtVerify(
    token,
    new TextEncoder().encode(process.env.NEXTAUTH_SECRET)
  );
  assert(verified.payload.jti, "expected JTI on User Token");
  return verified;
};
