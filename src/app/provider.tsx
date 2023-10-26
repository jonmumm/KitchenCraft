"use client";

import { ApplicationContext } from "@/context/application";
import { useActor } from "@/hooks/useActor";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink } from "@trpc/client";
import { map } from "nanostores";
import { ReactNode, useState } from "react";
import { trpcUrl } from "./_trpc";
import { trpc } from "./_trpc/client";
import { HeaderContext, createHeaderMachine } from "./header";

// export const ApplicationContext = createContext()

// const ApplicationInputSchema = z.object({
//   userId: z.string().optional(),
//   sessionId: z.string(),
// });
// type ApplicationInput = z.infer<typeof ApplicationInputSchema>;

export function ApplicationProvider(props: { children: ReactNode }) {
  const store = map<any>({}); // todo define global types here

  const [queryClient] = useState(
    new QueryClient({ defaultOptions: { queries: { staleTime: 5000 } } })
  );
  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [
        httpBatchLink({
          url: trpcUrl,
          // You can pass any HTTP headers you wish here
          // async headers() {
          //   return {
          //     authorization: getAuthCookie(),
          //   };
          // },
        }),
      ],
    })
  );
  // todo inject user-level data in to header

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <ApplicationContext.Provider value={store}>
          <HeaderProvider>{props.children}</HeaderProvider>
        </ApplicationContext.Provider>
      </QueryClientProvider>
    </trpc.Provider>
  );
}

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
