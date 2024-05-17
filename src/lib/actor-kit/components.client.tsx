"use client";

import { PageSessionContext } from "@/app/page-session-store.context";
import { env } from "@/env.public";
import { useEventSubject } from "@/hooks/useEvents";
import { useSend } from "@/hooks/useSend";
import { socket$ } from "@/stores/socket";
import { AppEvent } from "@/types";
import { Operation, applyPatch } from "fast-json-patch";
import { produce } from "immer";
import PartySocket from "partysocket";
import { ReactNode, useContext, useLayoutEffect } from "react";
import { z } from "zod";
import { getErrorMessage } from "../error";
import { noop } from "../utils";

export const ActorProvider = (props: {
  id: string;
  connectionId: string;
  token: string;
  children: ReactNode;
  // reauthenticate: () => Promise<void>;
}) => {
  const { connectionId, token, id } = props;
  const event$ = useEventSubject();
  const session$ = useContext(PageSessionContext);
  const send = useSend();

  useLayoutEffect(() => {
    if (socket$.get()) {
      return;
    }

    const socket = new PartySocket({
      host: env.KITCHENCRAFT_API_HOST,
      party: "page_session",
      room: id,
      id: connectionId,
      query: { token },
      debug: true,
    });
    socket$.set(socket);
    send({ type: "SOCKET_CONNECTING" });

    fetch(
      `https://${env.KITCHENCRAFT_API_HOST}/parties/page_session/${id}?token=${token}`,
      {
        method: "POST",
        body: JSON.stringify({
          type: "HEARTBEAT",
        } satisfies AppEvent),
      }
    ).then(noop);

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

      // applyPatch(snapshot, operations);
      // session$.set(produceWithPatches(session$.get()))
      const nextState = produce(session$.get(), (draft) => {
        applyPatch(draft, operations);
      });
      // console.log(session$.get(), nextState);
      session$.set(nextState);
    });

    socket.addEventListener("open", () => {
      send({ type: "SOCKET_OPEN" });
    });

    socket.addEventListener("connecting", () => {
      send({ type: "SOCKET_CONNECTING" });
    });

    socket.addEventListener("close", () => {
      send({ type: "SOCKET_CLOSE" });
    });

    socket.addEventListener("error", (error) => {
      send({ type: "SOCKET_ERROR", error: getErrorMessage(error) });
    });
  }, [send, connectionId, token, id, event$, session$]);

  return (
    <>
      {props.children}
      {/* <LoginHandler /> */}
    </>
  );
};
