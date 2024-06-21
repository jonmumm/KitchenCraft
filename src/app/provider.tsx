"use client";

import { PWALifeCycle } from "@/components/device/PWALifecycle";
import { ApplicationContext } from "@/context/application";
import { ServiceWorkerProvider } from "@/context/service-worker";
import { env } from "@/env.public";
import { useActor } from "@/hooks/useActor";
import { usePageSessionSelector } from "@/hooks/usePageSessionSelector";
import { usePosthogAnalytics } from "@/hooks/usePosthogAnalytics";
import { useSend } from "@/hooks/useSend";
import { getNextAuthSession } from "@/lib/auth/session";
import { map } from "nanostores";
import { SessionProvider, useSession } from "next-auth/react";
import {
  useParams,
  usePathname,
  useRouter,
  useSearchParams,
} from "next/navigation";
import { ReactNode, useContext, useEffect, useRef, useState } from "react";
import { createAppMachine } from "./app-machine";
import { AppContext } from "./context";
import { PageSessionContext } from "./page-session-store.context";

// export const ApplicationContext = createContext()

// const ApplicationInputSchema = z.object({
//   userId: z.string().optional(),
//   sessionId: z.string(),
// });
// type ApplicationInput = z.infer<typeof ApplicationInputSchema>;

export function ApplicationProvider(props: {
  children: ReactNode;
  nextAuthSession: Awaited<ReturnType<typeof getNextAuthSession>>;
  appSessionId: string | undefined;
  token: string;
}) {
  const [app$] = useState(
    map<{ appSessionId: string | undefined } & unknown>({
      appSessionId: props.appSessionId,
    })
  ); // todo define global types here
  const store = useContext(PageSessionContext);

  useEffect(() => {
    // @ts-expect-error
    window.app$ = app$;
    // @ts-expect-error
    window.store = store;
  }, [app$, store]);
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
      createAppMachine({
        searchParams: Object.fromEntries(searchParams.entries()),
        router,
        send,
        initialPath: pathname,
        session: props.nextAuthSession,
        store,
        token: props.token,
      })
    );

    useEffect(() => {
      // @ts-expect-error
      window.client$ = actor;
    }, [actor]);

    return <AppContext.Provider value={actor}>{children}</AppContext.Provider>;
  };

  return (
    <ServiceWorkerProvider>
      <SessionProvider session={props.nextAuthSession}>
        <ApplicationContext.Provider value={app$}>
          <CraftProvider>
            <SessionEventProviders />
            <VisibilityEventsProvider />
            <PageLoadEventsProvider />
            <SearchParamsEventsProvider />
            <HashChangeEventsProvider />
            <PopStateEventsProvider />
            <SignInProvider />
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
  }, [params, send]);

  return null;
};

const SignInProvider = () => {
  const shouldSignIn = usePageSessionSelector((state) => {
    return (
      state.context.sessionSnapshot?.value.Auth === "Authenticated" &&
      state.context.userSnapshot?.context.id &&
      state.context.sessionSnapshot?.context.userId &&
      state.context.userSnapshot.context.id !==
        state.context.sessionSnapshot.context.userId
    );
  });

  const SignInRedirect = () => {
    useEffect(() => {
      // todo callbackUrl add
      window.location.href = "/signin";
    });
    return null;
  };

  return shouldSignIn ? <SignInRedirect /> : <></>;
};

const PopStateEventsProvider = () => {
  const send = useSend();

  useEffect(() => {
    function onPopState(event: PopStateEvent) {
      // console.log("POPSTATE", event.state);
      // setTimeout(() => {
      //   console.log("POPSTATE", event.state);
      // }, 5000);
      send({ type: "POP_STATE", nativeEvent: event });
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

const SessionEventProviders = () => {
  const session = useSession();
  const send = useSend();
  const initializedRef = useRef(true);

  useEffect(() => {
    if (!initializedRef.current) {
      send({ type: "UPDATE_SESSION", session });
    }
    // if (loaded.current !== pathname) {
    //   send({ type: "PAGE_LOADED", pathname });
    //   loaded.current = pathname;
    // }
    return () => {};
  }, [send, session]);

  return null;
};

const VisibilityEventsProvider: React.FC = () => {
  const send = useSend();
  const visibilityStateRef = useRef<string>();

  useEffect(() => {
    // Ensure this code only runs in a browser environment
    if (typeof window !== "undefined" && typeof document !== "undefined") {
      visibilityStateRef.current = document.visibilityState;

      const handleVisibilityChange = () => {
        const currentVisibility = document.visibilityState;

        if (visibilityStateRef.current !== currentVisibility) {
          send({
            type: "VISIBILITY_CHANGE",
            visibilityState: currentVisibility,
          });
          visibilityStateRef.current = currentVisibility;
        }
      };

      document.addEventListener("visibilitychange", handleVisibilityChange);

      return () => {
        document.removeEventListener(
          "visibilitychange",
          handleVisibilityChange
        );
      };
    }
  }, [send]);

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
