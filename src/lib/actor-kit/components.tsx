// import { ActorSnapshots } from "@/actors/types";
// import { getUserServerActor } from "@/app/actor-client";
import { userActorClient } from "@/app/actor-client";
import { userAppMachine } from "@/app/app-machine.def";
import { assert } from "@/lib/utils";
import { ReactNode } from "react";
import { Actor, SnapshotFrom } from "xstate";
import { ServerActorProvider } from "./components.client";

export const ServerActorRoot = async (props: {
  id: string;
  render: (snapshot: SnapshotFrom<Actor<typeof userAppMachine>>) => ReactNode; // todo figure out how to hoise the type here out to make generic
}) => {
  const { id, render } = props;
  const resp = await userActorClient.get(id);
  const { snapshot, connectionId, token } = resp;
  assert(snapshot, "expected snapshot");
  console.log(snapshot);

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
