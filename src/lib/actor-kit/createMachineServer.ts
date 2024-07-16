import { json, notFound } from "@/lib/actor-kit/utils/response";
import { AppEventSchema, RequestInfoSchema, SystemEventSchema } from "@/schema";
import {
  AnyStateMachineWithIdInput,
  AppEvent,
  Caller,
  PartyMap,
  WithCaller,
  WithCloudFlareProps,
} from "@/types";
import { randomUUID } from "crypto";
import { compare } from "fast-json-patch";
import { SignJWT, jwtVerify } from "jose";
import type * as Party from "partykit/server";
import { PostHog } from "posthog-node";
import {
  Actor,
  AnyStateMachine,
  EventFrom,
  InputFrom,
  SnapshotFrom,
  Subscription,
  createActor,
  waitFor,
} from "xstate";
import { xstateMigrate } from "xstate-migrate";
import { z } from "zod";
import { parseAccessTokenForCaller } from "../session";
import { assert } from "../utils";

type ActorConnectionState = {
  postHogClient: PostHog;
};

type ActorConnection = Party.Connection<ActorConnectionState>;

const PERSISTED_SNAPSHOT_KEY = "persistedSnapshot";

export const createMachineServer = <
  TMachine extends AnyStateMachineWithIdInput,
>(
  createMachine: ({
    id,
    storage,
    parties,
  }: {
    id: string;
    storage: Party.Storage;
    parties: PartyMap;
  }) => TMachine,
  eventSchema: z.ZodSchema<Omit<EventFrom<TMachine>, "caller">>,
  persisted?: boolean
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

    private setupStatePersistence() {
      if (!persisted || !this.actor) return;

      this.actor.subscribe((state) => {
        const snapshot = this.actor?.getPersistedSnapshot();
        if (snapshot) {
          this.persistSnapshot(snapshot);
        }
      });
    }

    private async persistSnapshot(
      snapshot: ReturnType<Actor<TMachine>["getPersistedSnapshot"]>
    ) {
      try {
        await this.room.storage.put(
          PERSISTED_SNAPSHOT_KEY,
          JSON.stringify(snapshot)
        );
        console.log("Snapshot persisted successfully");
      } catch (error) {
        console.error("Error persisting snapshot:", error);
      }
    }

    async onStart() {
      if (persisted) {
        const persistentSnapshot = await this.room.storage.get(
          PERSISTED_SNAPSHOT_KEY
        );

        if (persistentSnapshot) {
          const input = {
            id: this.room.id,
            storage: this.room.storage,
            parties: this.room.context.parties,
          } as any;

          const machine = createMachine(input);

          const parsedSnapshot = JSON.parse(persistentSnapshot as string);
          const migrations = xstateMigrate.generateMigrations(
            machine,
            parsedSnapshot
          );

          if (migrations.length) {
            console.debug("Applying migrations: ", migrations);
          }

          const restoredSnapshot = xstateMigrate.applyMigrations(
            parsedSnapshot,
            migrations
          );

          this.actor = createActor(machine, {
            snapshot: restoredSnapshot,
            input: input as any,
          });
          this.actor.subscribe({
            error: (err) => {
              // todo report to sentry
              console.error(err);
            },
          });
          this.actor.start();
          this.actor.send({ type: "RESUME" } as any);

          // Set up persistence after resuming
          this.setupStatePersistence();
        }
      }
    }

    async onRequest(request: Party.Request) {
      const connectionId = randomUUID();
      const authHeader = request.headers.get("Authorization");
      const accessToken = authHeader?.split(" ")[1];
      let caller: Caller | undefined;

      const index = request.url.indexOf("?");
      const search = index !== -1 ? request.url.substring(index + 1) : "";
      const params = new URLSearchParams(search);
      const connectionToken = params.get("token");

      if (accessToken) {
        caller = await parseAccessTokenForCaller({
          accessToken,
          type: this.room.name,
          id: this.room.id,
        });
      } else if (connectionToken) {
        const connectionId = (await parseConnectionToken(connectionToken))
          .payload.jti;
        assert(
          connectionId,
          "expected connectionId when parsing connection token"
        );
        const existingCaller = this.callersByConnectionId.get(connectionId);
        caller = existingCaller;
      }
      assert(caller, "expected caller to be set");

      if (request.method === "GET") {
        const index = request.url.indexOf("?");
        const search = index !== -1 ? request.url.substring(index + 1) : "";
        const params = new URLSearchParams(search);
        const inputJsonString = params.get("input");
        assert(inputJsonString, "expected input object in query params");
        const inputJson = JSON.parse(inputJsonString);

        const actor = this.ensureActorRunning({ caller, inputJson });
        this.callersByConnectionId.set(connectionId, caller);
        const token = await createConnectionToken(this.room.id, connectionId);

        await waitFor(actor, (state) => {
          const anyState = state as SnapshotFrom<AnyStateMachine>;
          return anyState.matches({ Initialization: "Ready" }); // todo update the types to require this state somehow
        });

        const snapshot = actor.getPersistedSnapshot();
        this.lastSnapshotsByConnectionId.set(connectionId, snapshot);

        return json({
          connectionId,
          token,
          snapshot,
        });
      } else if (request.method === "POST") {
        if (caller.type === "system") {
          const json = await request.json();
          const event = SystemEventSchema.parse(json);

          // Set future events from this connection to
          // come from the userId
          if (event.type === "AUTHENTICATE") {
            this.callersByConnectionId.set(event.connectionId, {
              id: event.userId,
              type: "user",
            });
          }

          assert(
            this.actor,
            "expected actor to be defined when sending POST event"
          );
          this.actor.send(
            Object.assign(event, {
              caller: { type: "system" },
            }) as any
          );
        } else {
          const json = await request.json();
          const event = AppEventSchema.parse(json);

          // hack to add cf to HEART_BEAT events
          // tried adding it to all events but xstate
          // seemed to be stripping out the cf prop
          // when not on a specific event
          const payload = Object.assign(event, {
            caller,
            cf: request.cf,
          }) satisfies WithCloudFlareProps<WithCaller<AppEvent>>;
          assert(this.actor, "expected actor when sending post event");

          // @ts-expect-error
          this.actor.send(payload);
        }
        return json({
          status: "ok",
        });
      }

      return notFound();
    }

    private ensureActorRunning({
      caller,
      inputJson,
    }: {
      caller: Caller;
      inputJson?: Record<string, unknown>;
    }) {
      if (!this.actor) {
        const input = {
          id: this.room.id,
          initialCaller: caller,
          ...inputJson,
        } as InputFrom<TMachine>; // Asserting the type directly, should be a way to infer
        const machine = createMachine({
          id: this.room.id,
          storage: this.room.storage,
          parties: this.room.context.parties,
        });
        this.actor = createActor(machine, {
          input,
        });
        this.setupStatePersistence();
        this.actor.subscribe({
          error: (err) => {
            // debugger;
            // todo report to sentry
            console.error(err);
          },
        });
        this.actor.start();
      }
      return this.actor;
    }

    async onConnect(
      connection: ActorConnection,
      context: Party.ConnectionContext
    ) {
      // console.log(this.room.name);
      const authHeader = context.request.headers.get("Authorization");
      let caller: Caller | undefined;
      if (authHeader) {
        const accessToken = authHeader?.split(" ")[1];
        assert(
          accessToken,
          "Unable to parse Bearer header for for accessToken"
        );
        caller = await parseAccessTokenForCaller({
          accessToken,
          type: this.room.name,
          id: this.room.id,
        });
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
          "connectionId from token does not match connection id"
        );
        assert(connectionId, "expected connectionId from token");
        const existingCaller = this.callersByConnectionId.get(connection.id);
        caller = existingCaller;
      }

      // happens in dev all the time..
      if (!caller) {
        // todo: move this to onBeforeConnect?
        return;
      }

      // todo support for inputJson in websocket initial connections
      const actor = this.ensureActorRunning({ caller });

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
        this.lastSnapshotsByConnectionId.set(connection.id, nextSnapshot);
      };
      sendSnapshot();
      // const caller = this.callersByConnectionId.get(connection.id);
      const parties = this.room.context.parties;

      let requestInfo: z.infer<typeof RequestInfoSchema> | undefined;
      if (context.request.cf) {
        const result = RequestInfoSchema.safeParse(context.request.cf);
        if (result.success) {
          requestInfo = result.data;
        }
      }
      // @ts-expect-error
      actor.send({
        type: "CONNECT",
        connectionId: connection.id,
        caller,
        requestInfo,
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
          assert(this.actor, "expected actor when sending message");
          this.actor.send(
            Object.assign(event, {
              caller,
            }) as any
          );
        }
      } catch (ex) {
        console.warn("Error parsing event from client", ex);
      }
    }

    async onClose(connection: ActorConnection) {
      const sub = this.subscrptionsByConnectionId.get(connection.id);
      if (sub) {
        sub.unsubscribe();
      }
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
  return verified;
};
