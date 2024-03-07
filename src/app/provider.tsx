"use client";

import { PWALifeCycle } from "@/components/device/PWALifecycle";
import { ApplicationContext } from "@/context/application";
import { ServiceWorkerProvider } from "@/context/service-worker";
import { env } from "@/env.public";
import { useActor } from "@/hooks/useActor";
import { usePosthogAnalytics } from "@/hooks/usePosthogAnalytics";
import { useSend } from "@/hooks/useSend";
import { getSession } from "@/lib/auth/session";
import { map } from "nanostores";
import { SessionProvider } from "next-auth/react";
import {
  useParams,
  usePathname,
  useRouter,
  useSearchParams,
} from "next/navigation";
import { ReactNode, useContext, useEffect, useRef, useState } from "react";
import { CraftContext } from "./context";
import { createCraftMachine } from "./machine";
import { SessionStoreContext } from "./session-store.context";

// export const ApplicationContext = createContext()

// const ApplicationInputSchema = z.object({
//   userId: z.string().optional(),
//   sessionId: z.string(),
// });
// type ApplicationInput = z.infer<typeof ApplicationInputSchema>;

export function ApplicationProvider(props: {
  children: ReactNode;
  session: Awaited<ReturnType<typeof getSession>>;
  appSessionId: string | undefined;
}) {
  const [store] = useState(
    map<{ appSessionId: string | undefined } & unknown>({
      appSessionId: props.appSessionId,
    })
  ); // todo define global types here
  const session$ = useContext(SessionStoreContext);

  useEffect(() => {
    // @ts-expect-error
    window.app$ = store;
    // @ts-expect-error
    window.session$ = session$;
  }, [store, session$]);
  // const [permission, setPermission] = useState(() => {
  //   Notification.requestPermission();

  // })
  // useScrollRestoration(); // i dont know if this is well working or not

  const CraftProvider = ({ children }: { children: ReactNode }) => {
    const searchParams = useSearchParams();
    const pathname = usePathname();
    const router = useRouter();
    const send = useSend();

    const actor = useActor("craft", () =>
      createCraftMachine({
        searchParams: Object.fromEntries(searchParams.entries()),
        router,
        send,
        initialPath: pathname,
        session$,
      })
    );

    return (
      <CraftContext.Provider value={actor}>{children}</CraftContext.Provider>
    );
  };

  return (
    <ServiceWorkerProvider>
      <SessionProvider session={props.session}>
        <ApplicationContext.Provider value={store}>
          <CraftProvider>
            <PageLoadEventsProvider />
            <SearchParamsEventsProvider />
            <HashChangeEventsProvider />
            <PopStateEventsProvider />
            <AnalyticsProvider />
            {props.appSessionId && <PWALifeCycle />}
            {props.children}
          </CraftProvider>
        </ApplicationContext.Provider>
      </SessionProvider>
    </ServiceWorkerProvider>
  );
}

const AnalyticsProvider = () => {
  usePosthogAnalytics(env.POSTHOG_CLIENT_KEY);
  return null;
};

const HashChangeEventsProvider = () => {
  const send = useSend();
  const params = useParams();
  const lastHash = useRef<string>("");

  useEffect(() => {
    // Note <HashLink /> component sends this event itself, because it's faster than listening
    // to useParmas, but this works for getting it on initial load, so we keep it
    if (lastHash.current !== window.location.hash) {
      // Actors listening for this might not be running yet, so delay it
      setTimeout(() => {
        send({ type: "HASH_CHANGE", hash: window.location.hash });
      }, 0);
      lastHash.current = window.location.hash;
    }
  }, [params]);

  return null;
};

const PopStateEventsProvider = () => {
  const send = useSend();

  useEffect(() => {
    function onPopState(event: PopStateEvent) {
      // console.log("POPSTATE", event.state);
      // setTimeout(() => {
      //   console.log("POPSTATE", event.state);
      // }, 5000);
      event.preventDefault();
      // send({ type: "HASH_CHANGE", hash: window.location.hash });
    }

    // Add the event listener for hash changes
    window.addEventListener("popstate", onPopState, false);

    return () => {
      window.removeEventListener("popstate", onPopState);
    };
  }, [send]);

  return null;
};

const SearchParamsEventsProvider = () => {
  const searchParams = useSearchParams();
  const send = useSend();
  const lastSearchParams = useRef<typeof searchParams>(searchParams);

  useEffect(() => {
    if (lastSearchParams.current !== searchParams) {
      send({
        type: "UPDATE_SEARCH_PARAMS",
        searchParams: Object.fromEntries(searchParams.entries()),
      });
    }
  }, [send, searchParams]);

  return null;
};

const PageLoadEventsProvider = () => {
  const pathname = usePathname();
  // console.log({ pathname });
  const send = useSend();
  const loaded = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (loaded.current !== pathname) {
      send({ type: "PAGE_LOADED", pathname });
      loaded.current = pathname;
    }
  }, [send, pathname]);

  return null;
};

function getQueryParam(param: string): string | null {
  // Create a URLSearchParams object from the current URL's query string
  const queryParams = new URLSearchParams(window.location.search);

  // Return the value of the specified query parameter
  return queryParams.get(param);
}
