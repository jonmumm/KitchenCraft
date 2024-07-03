import { parseTokenForId } from "@/lib/actor-kit/tokens";
import { assert } from "@/lib/utils";
import { Caller, PartyMap } from "@/types";
import { fromPromise } from "xstate";

export const initializeUserSocket = fromPromise(
  async ({
    input,
  }: {
    input: {
      userAccessToken: string;
      caller: Caller;
      parties: PartyMap;
    };
  }) => {
    const userId = (await parseTokenForId(input.userAccessToken))
      .payload.jti;
    assert(userId, "expected id in user token");
    const socket = await input.parties.user!.get(userId).socket({
      headers: {
        Authorization: `Bearer ${input.userAccessToken}`,
      },
    });
    return socket;
  }
);
