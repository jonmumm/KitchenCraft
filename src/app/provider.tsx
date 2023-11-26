"use client";

import { SessionProvider } from "next-auth/react";
import { ApplicationContext } from "@/context/application";
import { useActor } from "@/hooks/useActor";
import { map } from "nanostores";
import {
  Profiler,
  ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { HeaderContext, createHeaderMachine } from "./header";
import {
  usePathname,
  useRouter,
  useSelectedLayoutSegment,
} from "next/navigation";
import { useSend } from "@/hooks/useSend";

// export const ApplicationContext = createContext()

// const ApplicationInputSchema = z.object({
//   userId: z.string().optional(),
//   sessionId: z.string(),
// });
// type ApplicationInput = z.infer<typeof ApplicationInputSchema>;

export function ApplicationProvider(props: { children: ReactNode }) {
  const [store] = useState(map<any>({})); // todo define global types here
  useScrollRestoration(); // i dont know if this is well working or not

  return (
    <SessionProvider>
      <ApplicationContext.Provider value={store}>
        <PageLoadEventsProvider />
        <HeaderProvider>{props.children}</HeaderProvider>
      </ApplicationContext.Provider>
    </SessionProvider>
  );
}

const PageLoadEventsProvider = () => {
  const pathname = usePathname();
  const send = useSend();

  useEffect(() => {
    send({ type: "PAGE_LOADED", pathname });
  }, [send, pathname]);

  return null;
};

const HeaderProvider = (props: { children: ReactNode }) => {
  const headerActor = useActor("header", createHeaderMachine());
  return (
    <HeaderContext.Provider value={headerActor}>
      {props.children}
    </HeaderContext.Provider>
  );
};

// export const ClientCookiesProvider: typeof CookiesProvider = (props) => (
//   <CookiesProvider {...props} />
// );

const useScrollRestoration = () => {
  const pathname = usePathname();

  // Save the scroll position to localStorage
  const saveScrollPosition = useCallback(() => {
    const scrollPosition = window.scrollY;
    const scrollPositions = JSON.parse(
      localStorage.getItem("scrollPositions") || "{}"
    );
    scrollPositions[pathname] = scrollPosition;
    localStorage.setItem("scrollPositions", JSON.stringify(scrollPositions));
  }, [pathname]);

  // Load the scroll position from localStorage
  const loadScrollPosition = useCallback(() => {
    const scrollPositions = JSON.parse(
      localStorage.getItem("scrollPositions") || "{}"
    );
    const savedPosition = scrollPositions[pathname];
    if (savedPosition) {
      window.scrollTo(0, savedPosition);
    }
  }, [pathname]);

  useEffect(() => {
    // Add scroll event listener
    window.addEventListener("scroll", saveScrollPosition);

    // Load the scroll position when the component mounts
    loadScrollPosition();

    // Clean up event listener
    return () => {
      window.removeEventListener("scroll", saveScrollPosition);
    };
  }, [saveScrollPosition, loadScrollPosition]);
};
