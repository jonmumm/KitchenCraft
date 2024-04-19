import { json, notFound } from "@/lib/actor-kit/utils/response";
import { Ai } from "partykit-ai";
import { AppEventSchema, SystemEventSchema } from "@/schema";
import { Caller } from "@/types";
import { randomUUID } from "crypto";
import { compare } from "fast-json-patch";
import { SignJWT } from "jose";
import type * as Party from "partykit/server";
import { AI } from "partykit/server";
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

const GuestCallerEventSchema = AppEventSchema;
const UserCallerEventSchema = AppEventSchema;
const SystemCallerEventSchema = SystemEventSchema;

type GuestCallerEvent = z.infer<typeof GuestCallerEventSchema>;
type UserCallerEvent = z.infer<typeof UserCallerEventSchema>;
type SystemCallerEvent = z.infer<typeof SystemCallerEventSchema>;

type EventMap = {
  guest: GuestCallerEvent;
  user: UserCallerEvent;
  system: SystemCallerEvent;
};

export const createActorHTTPClient = <
  TMachine extends AnyStateMachine,
  TCallerType extends keyof EventMap,
>(props: {
  type: string;
  caller: Caller & { type: TCallerType };
}) => {
  const get = async (id: string, input: Record<string, string>) => {
    const token = await createCallerToken(props.caller.id, props.caller.type);
    const resp = await fetch(
      `${API_SERVER_URL}/parties/${props.type}/${id}?input=${encodeURIComponent(
        JSON.stringify(input)
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

  const getSnapshot = async (id: string, input: Record<string, string>) => {
    return (await get(id, input)).snapshot as SnapshotFrom<Actor<TMachine>>;
  };

  const send = async (id: string, event: EventMap[TCallerType]) => {
    const token = await createCallerToken(props.caller.id, props.caller.type);
    const resp = await fetch(`${API_SERVER_URL}/parties/${props.type}/${id}`, {
      method: "POST",
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
    ai: Ai;
    actor: Actor<TMachine> | undefined;
    initialSnapshotsByConnectionId: Map<
      string,
      ReturnType<Actor<TMachine>["getPersistedSnapshot"]>
    >;
    callersByConnectionId: Map<string, Caller>;
    subscrptionsByConnectionId: Map<string, Subscription>;

    constructor(public room: Party.Room) {
      this.ai = new Ai(room.context.ai);
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
        // console.log(request.cf);
        const index = request.url.indexOf("?");
        const search = index !== -1 ? request.url.substring(index + 1) : "";
        const params = new URLSearchParams(search);
        const inputJsonString = params.get("input");
        assert(inputJsonString, "expected input object in query params");
        const inputJson = JSON.parse(inputJsonString);

        const input = {
          id: this.room.id,
          storage: this.room.storage,
          initialCaller: {
            id: caller.uniqueId,
            type: caller.uniqueIdType,
          } satisfies Caller,
          ...inputJson,
        } as InputFrom<TMachine>; // Asserting the type directly, should be a way to infer

        this.actor = createActor(machine, {
          input,
        });
        this.actor.start();

        this.callersByConnectionId.set(connectionId, {
          id: caller.uniqueId,
          type: caller.uniqueIdType,
        });
        const token = await createConnectionToken(this.room.id, connectionId);
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
      } else if (request.method === "POST") {
        if (caller.uniqueIdType === "system") {
          const json = await request.json();
          const event = SystemCallerEventSchema.parse(json);
          // Set future events from this connection to
          // come from the userId
          if (event.type === "AUTHENTICATE") {
            this.callersByConnectionId.set(event.connectionId, {
              id: event.userId,
              type: "user",
            });
          }

          const caller = { type: "system" };
          // @ts-expect-error
          this.actor.send(Object.assign(event, { caller }));
        }

        // todo handle events from clients directly here...
        // todo wait until no pending events left on it before we return...

        return json({
          status: "ok",
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

const createConnectionToken = async (id: string, connectionId: string) => {
  let signJWT = new SignJWT({})
    .setProtectedHeader({ alg: "HS256" })
    .setJti(connectionId)
    .setSubject(id)
    .setIssuedAt()
    .setExpirationTime("5m");

  const token = await signJWT.sign(
    new TextEncoder().encode(process.env.NEXTAUTH_SECRET) // todo parameterize this somehow and/or use diff env var
  );
  return token;
};
