"use client";

import { ApplicationContext } from "@/context/application";
import { useActor } from "@/hooks/useActor";
import { useSend } from "@/hooks/useSend";
import { getSession } from "@/lib/auth/session";
import { map } from "nanostores";
import { SessionProvider } from "next-auth/react";
import { usePathname } from "next/navigation";
import { ReactNode, useEffect, useState } from "react";
import { HeaderContext, createHeaderMachine } from "./header";

// export const ApplicationContext = createContext()

// const ApplicationInputSchema = z.object({
//   userId: z.string().optional(),
//   sessionId: z.string(),
// });
// type ApplicationInput = z.infer<typeof ApplicationInputSchema>;

export function ApplicationProvider(props: {
  children: ReactNode;
  session: Awaited<ReturnType<typeof getSession>>;
}) {
  const [store] = useState(map<any>({})); // todo define global types here
  // useScrollRestoration(); // i dont know if this is well working or not

  return (
    <SessionProvider session={props.session}>
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
