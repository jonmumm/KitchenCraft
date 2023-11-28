"use client";

import { ApplicationContext } from "@/context/application";
import { useActor } from "@/hooks/useActor";
import { useSend } from "@/hooks/useSend";
import { map } from "nanostores";
import { SessionProvider } from "next-auth/react";
import { usePathname } from "next/navigation";
import { ComponentProps, ReactNode, useEffect, useState } from "react";
import { UserContext } from "./context";
import { HeaderContext, createHeaderMachine } from "./header";

// export const ApplicationContext = createContext()

// const ApplicationInputSchema = z.object({
//   userId: z.string().optional(),
//   sessionId: z.string(),
// });
// type ApplicationInput = z.infer<typeof ApplicationInputSchema>;

export function ApplicationProvider(props: { children: ReactNode }) {
  const [store] = useState(map<any>({})); // todo define global types here
  // useScrollRestoration(); // i dont know if this is well working or not

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

export const UserProvider = ({
  children,
  ...props
}: ComponentProps<typeof UserContext.Provider>["value"] & {
  children: ReactNode;
}) => {
  return <UserContext.Provider value={props}>{children}</UserContext.Provider>;
};
