import { json, notFound } from "@/lib/actor-kit/utils/response";
import { AppEventSchema, SystemEventSchema } from "@/schema";
import { Caller } from "@/types";
import { randomUUID } from "crypto";
import { compare } from "fast-json-patch";
import { SignJWT, jwtVerify } from "jose";
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

// export const fromActorKit = <TMachine extends AnyStateMachine>(props: {
//   type: string;
//   caller: Caller;
//   id: string;
// }) => {
//   return fromEventObservable(() => {
//     // const responseSchema = z.object({
//     //   connectionId: z.string(),
//     //   token: z.string(),
//     //   snapshot: z.custom<SnapshotFrom<Actor<TMachine>>>(),
//     // });

//   });
// };

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
    actor: Actor<TMachine> | undefined;
    lastSnapshotsByConnectionId: Map<
      string,
      ReturnType<Actor<TMachine>["getPersistedSnapshot"]>
    >;
    callersByConnectionId: Map<string, Caller>;
    subscrptionsByConnectionId: Map<string, Subscription>;

    constructor(public room: Party.Room) {
      this.lastSnapshotsByConnectionId = new Map();
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
          partyContext: this.room.context,
          initialCaller: caller,
          ...inputJson,
        } as InputFrom<TMachine>; // Asserting the type directly, should be a way to infer
        // console.log(input);

        this.actor = createActor(machine, {
          input,
        });
        this.actor.start();

        // this.room.context.parties["session"]?.get("foo")

        this.callersByConnectionId.set(connectionId, caller);
        const token = await createConnectionToken(this.room.id, connectionId);
        const snapshot = this.actor.getPersistedSnapshot();

        // @ts-expect-error
        this.actor.send({
          type: "INITIALIZE",
          caller,
          parties: this.room.context.parties,
        });

        // TODO add await here if the machine supports it...
        // this would allow us to hydrate date before giving it back for SSR

        this.lastSnapshotsByConnectionId.set(connectionId, snapshot);

        return json({
          connectionId,
          token,
          snapshot,
        });
      } else if (request.method === "POST") {
        if (caller.type === "system") {
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

          // @ts-expect-error
          this.actor.send(Object.assign(event, { caller: { type: "system" } }));
        }

        // todo handle events from clients directly here...
        // todo wait until no pending events left on it before we return...

        return json({
          status: "ok",
        });
      }

      return notFound();
    }

    async onConnect(
      connection: UserActorConnection,
      context: Party.ConnectionContext
    ) {
      // console.log(this.room.name);
      const authHeader = context.request.headers.get("Authorization");
      let caller: Caller | undefined;
      if (authHeader) {
        const callerIdToken = authHeader?.split(" ")[1];
        assert(callerIdToken, "unable to parse bearer token");
        caller = await parseCallerIdToken(callerIdToken);
        this.callersByConnectionId.set(connection.id, caller);
      } else {
        const searchParams = new URLSearchParams(
          context.request.url.split("?")[1]
        );
        const token = searchParams.get("token");
        assert(token, "expected token when connecting to socket");
        const connectionId = (await parseConnectionToken(token)).payload.jti;
        assert(
          connectionId === connection.id,
          "connectionId from token does not mathc connection id"
        );
        assert(connectionId, "expected connectionId from token");
        const existingCaller = this.callersByConnectionId.get(connection.id);
        caller = existingCaller;
      }

      // happens in dev all the time..
      if (!caller) {
        // todo: move this to onBeforeCOnnect?
        return;
      }

      let actor = this.actor;
      // Happens if someone directly connects to the websocket before calling a GET request
      if (!actor) {
        const input = {
          id: this.room.id,
          storage: this.room.storage,
          partyContext: this.room.context,
          initialCaller: caller,
          // ...inputJson,
        } as InputFrom<TMachine>; // Asserting the type directly, should be a way to infer

        // console.log(input);

        actor = createActor(machine, {
          input,
        });
        actor.start();

        // @ts-expect-error
        actor.send({
          type: "INITIALIZE",
          caller,
          parties: this.room.context.parties,
        });

        this.actor = actor;
      }

      let lastSnapshot =
        this.lastSnapshotsByConnectionId.get(connection.id) || {};
      const sendSnapshot = (e?: any) => {
        assert(actor, "expected actor reference to exist");
        const nextSnapshot = actor.getPersistedSnapshot();
        const operations = compare(lastSnapshot, nextSnapshot);
        lastSnapshot = nextSnapshot;
        if (operations.length) {
          // todo sanitize `refs` in context from being written out...
          connection.send(JSON.stringify({ operations }));
        }
      };
      sendSnapshot();
      // const caller = this.callersByConnectionId.get(connection.id);
      const parties = this.room.context.parties;

      // @ts-expect-error
      actor.send({
        type: "CONNECT",
        connectionId: connection.id,
        caller,
        parties,
      });
      const sub = actor.subscribe(sendSnapshot);
      this.subscrptionsByConnectionId.set(connection.id, sub);
      // this.room.context.parties.get("")
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
    .setSubject("CONNECTION")
    .setIssuedAt()
    .setExpirationTime("1d");

  const token = await signJWT.sign(
    new TextEncoder().encode(process.env.NEXTAUTH_SECRET) // todo parameterize this somehow and/or use diff env var
  );
  return token;
};

const parseConnectionToken = async (token: string) => {
  const verified = await jwtVerify(
    token,
    new TextEncoder().encode(process.env.NEXTAUTH_SECRET)
  );
  assert(verified.payload.jti, "expected JTI on connectionToken");
  assert(
    verified.payload.sub === "CONNECTION",
    "expected connection token to have subject CONNECTION"
  );
  return verified;
};
