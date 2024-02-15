"use client";

import { userAppMachine } from "@/app/user-app-machine.def";
import { env } from "@/env.public";
import { useEventSubject } from "@/hooks/useEvents";
import { Operation, applyPatch } from "fast-json-patch";
import { atom } from "nanostores";
import PartySocket from "partysocket";
import { ReactNode, useLayoutEffect, useRef } from "react";
import { ActorRefFrom, SnapshotFrom } from "xstate";
import { z } from "zod";

export const ServerActorProvider = (props: {
  id: string;
  connectionId: string;
  token: string;
  initial: SnapshotFrom<ActorRefFrom<typeof userAppMachine>>; // todo make generic
  children: ReactNode;
}) => {
  const { connectionId, token, id, initial } = props;
  const initializedRef = useRef(false);
  const event$ = useEventSubject();

  useLayoutEffect(() => {
    if (initializedRef.current) {
      return;
    }
    initializedRef.current = true;

    const snapshotStore = atom(initial);

    const socket = new PartySocket({
      host: env.KITCHENCRAFT_API_HOST,
      party: "actor",
      room: id,
      id: connectionId,
      query: { token },
    });

    event$.subscribe((event) => {
      try {
        // const event = AppEventSchema.parse(JSON.parse(event))
        // console.log(event);
        socket.send(JSON.stringify(event));
      } catch (ex) {
        // todo better handle not sending events
        // this will fail if we send anon-serializable prop
        // value like a dom element
        // thats fine because server doesnt need but
        // we should make more predictable
      }
    });

    socket.addEventListener("message", (message: MessageEvent<string>) => {
      const { operations } = z
        .object({ operations: z.array(z.custom<Operation>()) })
        .parse(JSON.parse(message.data));
      const snapshot = snapshotStore.get();

      applyPatch(snapshot, operations);
      snapshotStore.set({
        ...snapshot,
      });
    });
  }, [initializedRef, connectionId, token, id, initial, event$]);

  return <>{props.children}</>;
};
