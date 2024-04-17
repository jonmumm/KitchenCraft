"use client";

import { SessionStoreContext } from "@/app/page-session-store.context";
import { env } from "@/env.public";
import { useEventSubject } from "@/hooks/useEvents";
import { Operation, applyPatch } from "fast-json-patch";
import { produce } from "immer";
import { atom } from "nanostores";
import { useSession } from "next-auth/react";
import PartySocket from "partysocket";
import {
  ReactNode,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
} from "react";
import { z } from "zod";

const initialized$ = atom(false);

export const ActorProvider = (props: {
  id: string;
  connectionId: string;
  token: string;
  children: ReactNode;
  // reauthenticate: () => Promise<void>;
}) => {
  const { connectionId, token, id } = props;
  const event$ = useEventSubject();
  const session$ = useContext(SessionStoreContext);

  // const LoginHandler = () => {
  //   const session = useSession();
  //   // Store the previous session for comparison
  //   const previousSession = usePrevious(session);

  //   // useEffect(() => {
  //   //   // Check if there was a transition from unauthenticated to authenticated
  //   //   if (
  //   //     previousSession?.status === "unauthenticated" &&
  //   //     session.status === "authenticated"
  //   //   ) {
  //   //     props.reauthenticate().catch((error) => {
  //   //       console.error("Reauthentication failed:", error);
  //   //     });
  //   //   }
  //   // }, [session, previousSession, props.reauthenticate]);

  //   return null;
  // };

  useLayoutEffect(() => {
    if (initialized$.get()) {
      return;
    }
    initialized$.set(true);

    const socket = new PartySocket({
      host: env.KITCHENCRAFT_API_HOST,
      party: "page_session",
      room: id,
      id: connectionId,
      query: { token },
      debug: true,
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

    const initMessageListener = () => {
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
    };

    // socket.addEventListener("open", () => {

    // });
    initMessageListener();

    socket.addEventListener("close", () => {
      console.log("socket closed");
      socket.addEventListener("open", () => {
        initMessageListener();
      });
    });

    socket.addEventListener("error", (error) => {
      console.error("Socket ERror", error);
    });
  }, [connectionId, token, id, event$, session$]);

  return (
    <>
      {props.children}
      {/* <LoginHandler /> */}
    </>
  );
};

function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T>();

  useEffect(() => {
    ref.current = value;
  }, [value]); // Only re-run if value changes

  return ref.current; // Return previous value (happens before update in useEffect above)
}
