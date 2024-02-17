import { sessionActorClient } from "@/app/session-http-client";
import { sessionMachine } from "@/app/session-machine";
import { assert } from "@/lib/utils";
import { ReactNode } from "react";
import { Actor, SnapshotFrom } from "xstate";
import { ServerActorProvider } from "./components.client";

export const SessionActorRoot = async (props: {
  id: string;
  render: (snapshot: SnapshotFrom<Actor<typeof sessionMachine>>) => ReactNode; // todo figure out how to hoise the type here out to make generic
}) => {
  const { id, render } = props;
  const { snapshot, connectionId, token } = await sessionActorClient.get(id);
  assert(snapshot, "expected snapshot");

  return (
    <ServerActorProvider
      id={id}
      connectionId={connectionId}
      token={token}
      initial={snapshot}
    >
      {render(snapshot)}
    </ServerActorProvider>
  );
};
