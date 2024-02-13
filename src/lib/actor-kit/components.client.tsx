"use client";

import { userAppMachine } from "@/app/app-machine.def";
import { env } from "@/env.public";
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
  }, [initializedRef, connectionId, token, id, initial]);

  return <>{props.children}</>;
};
