import { produce } from "immer";

import { UserMachine } from "@/app/user-machine";
import { assert } from "@/lib/utils";
import { ActorSocketEvent, ServerPartySocket } from "@/types";
import { Operation, applyPatch } from "fast-json-patch";
import { Subject } from "rxjs";
import { SnapshotFrom, fromEventObservable } from "xstate";
import { z } from "zod";

export type ListenUserEvent = ActorSocketEvent<"USER", UserMachine>;

export const listenUser = fromEventObservable(
  ({
    input,
  }: {
    input: {
      socket: ServerPartySocket;
    };
  }) => {
    const subject = new Subject<ListenUserEvent>();
    const { socket } = input;

    socket.addEventListener("error", (error) => {
      console.error("error", error);
    });

    let currentSnapshot: SnapshotFrom<UserMachine> | undefined = undefined;

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
        type: "USER_UPDATE",
        snapshot: nextSnapshot as any,
        operations,
      });
      currentSnapshot = nextSnapshot as any;
    });

    socket.addEventListener("close", () => {
      subject.next({ type: "USER_DISCONNECT" });
    });

    return subject;
  }
);
