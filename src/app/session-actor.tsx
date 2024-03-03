import { sessionActorClient } from "@/app/session-http-client";
import { sessionMachine } from "@/app/session-machine";
import { assert } from "@/lib/utils";
import { ReactNode } from "react";
import { Actor, SnapshotFrom } from "xstate";
import { ActorProvider } from "../lib/actor-kit/components.client";
import { SessionStoreProvider } from "./session-store-provider";
import { SessionSnapshot } from "./session-store";

export const SessionActor = async (props: {
  id: string;
  render: (snapshot: SessionSnapshot) => ReactNode; // todo figure out how to hoise the type here out to make generic
}) => {
  const { id, render } = props;
  const { snapshot, connectionId, token } = await sessionActorClient.get(id);
  assert(snapshot, "expected snapshot");

  return (
    <SessionStoreProvider initial={snapshot}>
      <ActorProvider
        id={id}
        connectionId={connectionId}
        token={token}
      >
        {render(snapshot)}
      </ActorProvider>
    </SessionStoreProvider>
  );
};
