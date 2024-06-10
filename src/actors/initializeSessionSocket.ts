import { assert } from "@/lib/utils";
import { Caller, PartyMap } from "@/types";
import { jwtVerify } from "jose";
import { fromPromise } from "xstate";

export const initializeSessionSocket = fromPromise(
  async ({
    input,
  }: {
    input: {
      sessionAccessToken: string;
      caller: Caller;
      parties: PartyMap;
    };
  }) => {
    const sessionId = (
      await parseSessionAccessTokenForId(input.sessionAccessToken)
    ).payload.jti;
    assert(sessionId, "expected session id in session token");
    // const token = await createCallerToken(input.caller.id, input.caller.type);
    const socket = await input.parties.session!.get(sessionId).socket({
      headers: {
        Authorization: `Bearer ${input.sessionAccessToken}`,
      },
    });
    return socket;
  }
);

const parseSessionAccessTokenForId = async (token: string) => {
  const verified = await jwtVerify(
    token,
    new TextEncoder().encode(process.env.NEXTAUTH_SECRET)
  );
  assert(verified.payload.jti, "expected JTI on Session Token");
  return verified;
};
