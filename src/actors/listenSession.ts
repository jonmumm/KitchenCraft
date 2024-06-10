import { produce } from "immer";

import type { SessionMachine } from "@/app/session-machine";
import { assert } from "@/lib/utils";
import { ActorSocketEvent, ServerPartySocket } from "@/types";
import { Operation, applyPatch } from "fast-json-patch";
import { Subject } from "rxjs";
import { SnapshotFrom, fromEventObservable } from "xstate";
import { z } from "zod";

export type ListenSessionEvent = ActorSocketEvent<"SESSION", SessionMachine>;

export const listenSession = fromEventObservable(
  ({
    input,
  }: {
    input: {
      socket: ServerPartySocket;
    };
  }) => {
    const subject = new Subject<ListenSessionEvent>();
    const { socket } = input;

    socket.addEventListener("error", (error) => {
      console.error("error", error);
    });

    let currentSnapshot: SnapshotFrom<SessionMachine> | undefined = undefined;

    socket.addEventListener("message", (message) => {
      assert(
        typeof message.data === "string",
        "expected message data to be a string"
      );

      const { operations } = z
        .object({ operations: z.array(z.custom<Operation>()) })
        .parse(JSON.parse(message.data));

      const nextSnapshot = produce(currentSnapshot || {}, (draft) => {
        applyPatch(draft, operations);
      });
      subject.next({
        type: "SESSION_UPDATE",
        snapshot: nextSnapshot as any,
        operations,
      });
      currentSnapshot = nextSnapshot as any;
    });

    socket.addEventListener("close", () => {
      subject.next({ type: "SESSION_DISCONNECT" });
    });

    return subject;
  }
);
