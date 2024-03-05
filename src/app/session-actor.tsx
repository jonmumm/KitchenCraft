import { sessionMachine } from "@/app/session-machine";
import { createActorHTTPClient } from "@/lib/actor-kit";
import { getUniqueId, getUniqueIdType } from "@/lib/auth/session";
import { assert } from "@/lib/utils";
import { ReactNode } from "react";
import { ActorProvider } from "../lib/actor-kit/components.client";
import { SessionSnapshot } from "./session-store";
import { SessionStoreProvider } from "./session-store-provider";

export const SessionActor = async (props: {
  id: string;
  render: (snapshot: SessionSnapshot) => ReactNode; // todo figure out how to hoise the type here out to make generic
}) => {
  const { id, render } = props;
  const uniqueId = await getUniqueId();
  const uniqueIdType = await getUniqueIdType();

  const sessionActorClient = createActorHTTPClient<typeof sessionMachine>({
    type: "session",
    caller: {
      id: uniqueId,
      type: uniqueIdType,
    },
  });

  const { snapshot, connectionId, token } = await sessionActorClient.get(id);
  assert(snapshot, "expected snapshot");

  return (
    <SessionStoreProvider initial={snapshot}>
      <ActorProvider id={id} connectionId={connectionId} token={token}>
        {render(snapshot)}
      </ActorProvider>
    </SessionStoreProvider>
  );
};
