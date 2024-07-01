"use client";

import { PWALifeCycle } from "@/components/device/PWALifecycle";
import { GlobalContext } from "@/context/application";
import { ServiceWorkerProvider } from "@/context/service-worker";
import { env } from "@/env.public";
import { useActor } from "@/hooks/useActor";
import { useAppContext } from "@/hooks/useAppContext";
import { usePageSessionSelector } from "@/hooks/usePageSessionSelector";
import { usePosthogAnalytics } from "@/hooks/usePosthogAnalytics";
import { useSend } from "@/hooks/useSend";
import { getNextAuthSession } from "@/lib/auth/session";
import { selectHistory } from "@/selectors/app.selectors";
import { ExtraAppProps } from "@/types";
import { map } from "nanostores";
import { SessionProvider } from "next-auth/react";
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
  token: string;
  extraProps: ExtraAppProps;
}) {
  const [global$] = useState(
    map<ExtraAppProps & unknown>({
      ...props.extraProps,
    })
  ); // todo define global types here
  const store = useContext(PageSessionContext);

  useEffect(() => {
    // @ts-expect-error
    window.global$ = global$;
    // @ts-expect-error
    window.store = store;
  }, [global$, store]);
  // const [permission, setPermission] = useState(() => {
  //   Notification.requestPermission();

  // })
  // useScrollRestoration(); // i dont know if this is well working or not

  const CraftProvider = ({ children }: { children: ReactNode }) => {
    const searchParams = useSearchParams();
    const pathname = usePathname();
    const router = useRouter();
    const send = useSend();

    const actor = useActor("app", () => {
      const search = searchParams.toString();
      const initialPath = pathname + (search.length ? `?${search}` : "");

      return createAppMachine({
        searchParams: Object.fromEntries(searchParams.entries()),
        router,
        send,
        initialPath,
        store,
        token: props.token,
      });
    });

    useEffect(() => {
      // @ts-expect-error
      window.appMachine$ = actor;
    }, [actor]);

    return <AppContext.Provider value={actor}>{children}</AppContext.Provider>;
  };

  return (
    <ServiceWorkerProvider>
      <SessionProvider session={props.nextAuthSession}>
        <GlobalContext.Provider value={global$}>
          <CraftProvider>
            <VisibilityEventsProvider />
            <NavigationEventsProvider />
            <HashChangeEventsProvider />
            <SignInProvider />
            <AnalyticsProvider />
            {props.extraProps.appSessionId && <PWALifeCycle />}
            {props.children}
          </CraftProvider>
        </GlobalContext.Provider>
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

const NavigationEventsProvider: React.FC = () => {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const send = useSend();
  const app$ = useAppContext();
  const lastSearchParams = useRef<typeof searchParams>(searchParams);
  const lastPathname = useRef<string | undefined>(undefined);
  const isInitialMount = useRef(true);
  const isBackNavigation = useRef(false);

  useEffect(() => {
    const history = selectHistory(app$.getSnapshot()) as string[];
    const fullPath = pathname + window.location.search + window.location.hash;
    const isPathInHistory = history.includes(fullPath);

    let direction: "forward" | "backward" | "initial";
    if (isInitialMount.current) {
      direction = "initial";
    } else if (isBackNavigation.current) {
      direction = "backward";
    } else {
      direction = "forward";
    }

    // Handle search params change
    if (lastSearchParams.current !== searchParams) {
      send({
        type: "UPDATE_SEARCH_PARAMS",
        searchParams: Object.fromEntries(searchParams.entries()),
      });
      lastSearchParams.current = searchParams;
    }

    // Handle page load (pathname change)
    if (lastPathname.current !== pathname) {
      send({
        type: "PAGE_LOADED",
        pathname: fullPath,
        direction,
      });
      lastPathname.current = fullPath;
    }
    console.log({ isPathInHistory, direction });

    // Handle push state, but avoid sending on initial mount
    if (
      !isInitialMount.current &&
      direction === "forward" &&
      !isPathInHistory
    ) {
      send({ type: "PUSH_STATE", path: fullPath });
    }

    // Reset flags
    isInitialMount.current = false;
    isBackNavigation.current = false;
  }, [send, searchParams, pathname, app$]);

  useEffect(() => {
    function onPopState(event: PopStateEvent) {
      isBackNavigation.current = true;
      send({ type: "POP_STATE", nativeEvent: event });
    }

    window.addEventListener("popstate", onPopState, false);

    return () => {
      window.removeEventListener("popstate", onPopState);
    };
  }, [send]);

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

function getQueryParam(param: string): string | null {
  // Create a URLSearchParams object from the current URL's query string
  const queryParams = new URLSearchParams(window.location.search);

  // Return the value of the specified query parameter
  return queryParams.get(param);
}
