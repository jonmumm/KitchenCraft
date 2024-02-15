import { getUserServerActor } from "@/app/user-actor.client";
import { userAppMachine } from "@/app/user-app-machine.def";
import { assert } from "@/lib/utils";
import { ReactNode } from "react";
import { Actor, SnapshotFrom } from "xstate";
import { ServerActorProvider } from "./components.client";

export const ServerActorRoot = async (props: {
  id: string;
  render: (snapshot: SnapshotFrom<Actor<typeof userAppMachine>>) => ReactNode; // todo figure out how to hoise the type here out to make generic
}) => {
  const { id, render } = props;
  // const resp = await userActorClient.get(id);
  const { snapshot, connectionId, token } = await getUserServerActor(id);
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
