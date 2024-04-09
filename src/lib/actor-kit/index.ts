import { json, notFound } from "@/lib/actor-kit/utils/response";
import { AppEvent, Caller } from "@/types";
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
import { createCallerToken, parseCallerIdToken } from "../browser-session";
import { assert } from "../utils";
import { API_SERVER_URL } from "./constants";

type UserActorConnectionState = {
  id: string;
  userId: string;
};

type UserActorConnection = Party.Connection<UserActorConnectionState>;

export const createActorHTTPClient = <TMachine extends AnyStateMachine>(props: {
  type: string;
  caller: Caller;
  input: Record<string, string>; // todo type this to the machine
}) => {
  const get = async (id: string) => {
    const token = await createCallerToken(props.caller.id, props.caller.type);
    const resp = await fetch(
      `${API_SERVER_URL}/parties/${props.type}/${id}?input=${JSON.stringify(
        props.input
      )}`,
      {
        next: { revalidate: 0 },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

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

  const send = async (id: string, event: AppEvent) => {
    const token = await createCallerToken(props.caller.id, props.caller.type);
    const resp = await fetch(`${API_SERVER_URL}/parties/${props.type}/${id}`, {
      method: "POST",
      next: { revalidate: 0 },
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(event),
    });

    return await resp.json();
  };

  return { get, getSnapshot, send };
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
  eventSchema: z.ZodSchema<Omit<EventFrom<TMachine>, "caller">>
) => {
  class ActorServer implements Party.Server {
    actor: Actor<TMachine> | undefined;
    initialSnapshotsByConnectionId: Map<
      string,
      ReturnType<Actor<TMachine>["getPersistedSnapshot"]>
    >;
    callersByConnectionId: Map<string, Caller>;
    subscrptionsByConnectionId: Map<string, Subscription>;

    constructor(public room: Party.Room) {
      this.initialSnapshotsByConnectionId = new Map();
      this.callersByConnectionId = new Map();
      this.subscrptionsByConnectionId = new Map();
    }

    onStart() {
      // send actor any events to load things here
    }

    async onRequest(request: Party.Request) {
      const connectionId = randomUUID();
      const authHeader = request.headers.get("authorization");
      const callerIdToken = authHeader?.split(" ")[1];
      assert(callerIdToken, "unable to parse bearer token");
      const caller = await parseCallerIdToken(callerIdToken);

      // if (request.method === "POST") {
      //   // todo requi're a caller token before allowing this send...
      //   // dont thinkw e use this anywhere yet
      //   const json = await request.json();
      //   const event = eventSchema.parse(json);
      //   // @ts-expect-error
      //   this.actor.send(Object.assign(event, { caller }));
      //   return ok();
      // }

      if (request.method === "GET") {
        const search = request.url.split("?")[1];
        const params = new URLSearchParams(search || "");
        const inputJsonString = params.get("input");
        assert(inputJsonString, "expected input object in query params");

        const input = {
          id: this.room.id,
          storage: this.room.storage,
          initialCaller: {
            id: caller.uniqueId,
            type: caller.uniqueIdType,
          } satisfies Caller,
          ...JSON.parse(inputJsonString),
        } as InputFrom<TMachine>; // Asserting the type directly, should be a way to infer

        this.actor = createActor(machine, {
          input,
        });
        this.actor.start();

        this.callersByConnectionId.set(connectionId, {
          id: caller.uniqueId,
          type: caller.uniqueIdType,
        });
        const token = randomUUID(); // todo make this a jwt
        const snapshot = this.actor.getPersistedSnapshot();

        // @ts-expect-error
        this.actor.send({
          type: "GET_SNAPSHOT",
          caller,
        });

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
      const actor = this.actor;
      if (!actor) {
        // if not dev
        // assert(actor, "expected actor to exist before websocket connection");
        return;
      }

      const initialSnapshot = this.initialSnapshotsByConnectionId.get(
        connection.id
      );

      // Probably a re-connect... in order to subscribe need to have been
      if (!initialSnapshot) {
        return;
      }

      let lastSnapshot = initialSnapshot;
      const sendSnapshot = (e?: any) => {
        const nextSnapshot = actor.getPersistedSnapshot();
        const operations = compare(lastSnapshot, nextSnapshot);
        lastSnapshot = nextSnapshot;
        if (operations.length) {
          connection.send(JSON.stringify({ operations }));
        }
      };
      sendSnapshot();
      const sub = actor.subscribe(sendSnapshot);
      this.subscrptionsByConnectionId.set(connection.id, sub);
    }

    async onMessage(message: string, sender: Party.Connection) {
      try {
        const event = eventSchema.parse(JSON.parse(message));
        const caller = this.callersByConnectionId.get(sender.id);
        if (caller) {
          // todo idk how to do this
          // @ts-expect-error
          this.actor.send(Object.assign(event, { caller }));
        }

        // console.log("kit", event);
      } catch (ex) {
        console.warn("Error parsing event from client", ex);
      }
    }

    async onClose(connection: Party.Connection) {
      const sub = this.subscrptionsByConnectionId.get(connection.id);
      if (sub) {
        sub.unsubscribe();
      }
      // assert(sub, "expected sub on close");
    }
  }

  return ActorServer satisfies Party.Worker;
};
