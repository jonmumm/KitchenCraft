"use client";

import { sessionMachine } from "@/app/session-machine";
import { env } from "@/env.public";
import { useEventSubject } from "@/hooks/useEvents";
import { Operation, applyPatch } from "fast-json-patch";
import { atom } from "nanostores";
import PartySocket from "partysocket";
import { ReactNode, useLayoutEffect, useRef } from "react";
import { ActorRefFrom, SnapshotFrom } from "xstate";
import { z } from "zod";

type SessionSnapshot = SnapshotFrom<ActorRefFrom<typeof sessionMachine>>; // todo make generic
const sessionSnapshot$ = atom({} as SessionSnapshot);

export const ServerActorProvider = (props: {
  id: string;
  connectionId: string;
  token: string;
  initial: SessionSnapshot;
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

    const socket = new PartySocket({
      host: env.KITCHENCRAFT_API_HOST,
      party: "session",
      room: id,
      id: connectionId,
      query: { token },
    });

    event$.subscribe((event) => {
      try {
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
      const snapshot = sessionSnapshot$.get();

      applyPatch(snapshot, operations);
      sessionSnapshot$.set({
        ...snapshot,
      });
    });
  }, [initializedRef, connectionId, token, id, initial, event$]);

  return <>{props.children}</>;
};
