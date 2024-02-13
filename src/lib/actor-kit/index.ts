import { json, notFound, ok } from "@/lib/actor-kit/utils/response";
import { assert } from "@/lib/utils";
import { randomUUID } from "crypto";
import { compare } from "fast-json-patch";
import type * as Party from "partykit/server";
import {
  Actor,
  AnyStateMachine,
  EventFrom,
  InputFrom,
  SnapshotFrom,
  StateMachine,
  Subscription,
  createActor,
} from "xstate";
import { z } from "zod";
import { API_SERVER_URL } from "./constants";

type UserActorConnectionState = {
  id: string;
  userId: string;
};

type UserActorConnection = Party.Connection<UserActorConnectionState>;

export const createActorClient = <TMachine extends AnyStateMachine>() => {
  const get = async (id: string) => {
    const resp = await fetch(`${API_SERVER_URL}/parties/actor/${id}`, {
      next: { revalidate: 0 },
    });

    const responseSchema = z.object({
      connectionId: z.string(),
      token: z.string(),
      snapshot: z.custom<SnapshotFrom<Actor<TMachine>>>(),
    });

    return responseSchema.parse(await resp.json());
  };

  const getSnapshot = async (id: string) => {
    return (await get(id)).snapshot as SnapshotFrom<Actor<TMachine>>;
  };

  return { get, getSnapshot };
};

type WithIdInput = { id: string };
type AnyStateMachineWithIdInput = StateMachine<
  any, // context
  any, // event
  any, // children
  any, // actor
  any, // action
  any, // guard
  any, // delay
  any, // state value
  any, // tag
  WithIdInput, // input, now explicitly requiring an object with an id of type string
  any // output
>;

export const createMachineServer = <
  TMachine extends AnyStateMachineWithIdInput,
>(
  machine: TMachine,
  eventSchema: z.ZodSchema<EventFrom<TMachine>>
) => {
  class ActorServer implements Party.Server {
    actor: Actor<TMachine>;
    initialSnapshotsByConnectionId: Map<
      string,
      ReturnType<Actor<TMachine>["getPersistedSnapshot"]>
    >;
    subscrptionsByConnectionId: Map<string, Subscription>;

    constructor(public room: Party.Room) {
      const input = {
        id: this.room.id,
      } as InputFrom<TMachine>; // Asserting the type directly, should be a way to infer

      this.actor = createActor(machine, {
        input,
      });
      this.actor.start();

      this.initialSnapshotsByConnectionId = new Map();
      this.subscrptionsByConnectionId = new Map();
    }

    onStart() {
      // send actor any events to load things here
    }

    async onRequest(request: Party.Request) {
      if (request.method === "POST") {
        const json = await request.json();
        const event = eventSchema.parse(json);
        this.actor.send(event);
        return ok();
      }

      if (request.method === "GET") {
        const connectionId = randomUUID();
        // this.actor.send({ type: "FETCH", connectionId });
        const token = randomUUID(); // todo make this a jwt
        const snapshot = this.actor.getPersistedSnapshot();

        // Clients have 30 seconds to connect before the snapshot gets cleaned up
        // and they must re-sync the full data
        this.initialSnapshotsByConnectionId.set(connectionId, snapshot);
        setTimeout(() => {
          this.initialSnapshotsByConnectionId.delete(connectionId);
        }, 30000);

        return json({
          connectionId,
          token,
          snapshot,
        });
      }

      return notFound();
    }

    async onConnect(connection: UserActorConnection) {
      const initialSnapshot = this.initialSnapshotsByConnectionId.get(
        connection.id
      );

      // Probably a re-connect... in order to subscribe need to have been
      if (!initialSnapshot) {
        return;
      }

      let lastSnapshot = initialSnapshot;
      const sendSnapshot = () => {
        const nextSnapshot = this.actor.getPersistedSnapshot();
        const operations = compare(lastSnapshot, nextSnapshot);
        lastSnapshot = nextSnapshot;
        connection.send(JSON.stringify({ operations }));
      };
      sendSnapshot();
      const sub = this.actor.subscribe(sendSnapshot);
      this.subscrptionsByConnectionId.set(connection.id, sub);
    }

    async onClose(connection: Party.Connection) {
      const sub = this.subscrptionsByConnectionId.get(connection.id);
      assert(sub, "expected sub on close");
      sub.unsubscribe();
    }
  }

  return ActorServer satisfies Party.Worker;
};
