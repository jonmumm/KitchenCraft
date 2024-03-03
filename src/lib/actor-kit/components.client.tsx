"use client";

import { SessionStoreContext } from "@/app/session-store.context";
import { env } from "@/env.public";
import { useEventSubject } from "@/hooks/useEvents";
import { Operation, applyPatch } from "fast-json-patch";
import PartySocket from "partysocket";
import { ReactNode, useContext, useLayoutEffect, useRef } from "react";
import { z } from "zod";

export const ActorProvider = (props: {
  id: string;
  connectionId: string;
  token: string;
  children: ReactNode;
}) => {
  const { connectionId, token, id } = props;
  const initializedRef = useRef(false);
  const event$ = useEventSubject();
  const session$ = useContext(SessionStoreContext);

  useLayoutEffect(() => {
    if (initializedRef.current) {
      return;
    }
    initializedRef.current = true;
    // session$.set(initial);

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
      const snapshot = session$.get();

      applyPatch(snapshot, operations);
      session$.set({
        ...snapshot,
      });
    });
  }, [initializedRef, connectionId, token, id, event$, session$]);

  return <>{props.children}</>;
};
