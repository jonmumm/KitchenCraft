import { assert } from "@/lib/utils";
import { headers } from "next/headers";
import { sendAction } from "./actions";

export const getSendAction = () => {
  const headersList = headers();
  const actorId = headersList.get("x-actor-id");
  assert(actorId, "expected actor id");
  const sendActionToActor = sendAction.bind(null, actorId);
  return sendActionToActor;
};
