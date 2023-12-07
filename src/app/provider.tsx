"use client";

import { ApplicationContext } from "@/context/application";
import { env } from "@/env.public";
import { usePosthogAnalytics } from "@/hooks/usePosthogAnalytics";
import { useSend } from "@/hooks/useSend";
import { getSession } from "@/lib/auth/session";
import { map } from "nanostores";
import { SessionProvider } from "next-auth/react";
import { usePathname } from "next/navigation";
import { ReactNode, useEffect, useState } from "react";

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
        <AnalyticsProvider />
        {props.children}
      </ApplicationContext.Provider>
    </SessionProvider>
  );
}

const AnalyticsProvider = () => {
  usePosthogAnalytics(env.POSTHOG_CLIENT_KEY);
  return null;
};

const PageLoadEventsProvider = () => {
  const pathname = usePathname();
  const send = useSend();

  useEffect(() => {
    send({ type: "PAGE_LOADED", pathname });
  }, [send, pathname]);

  return null;
};

// const HeaderProvider = (props: { children: ReactNode }) => {
//   const headerActor = useActor("header", createHeaderMachine());
//   return (
//     <HeaderContext.Provider value={headerActor}>
//       {props.children}
//     </HeaderContext.Provider>
//   );
// };
