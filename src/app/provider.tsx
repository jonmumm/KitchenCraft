"use client";

import { ApplicationContext } from "@/context/application";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink } from "@trpc/client";
import { map } from "nanostores";
import { ReactNode, useState } from "react";
import { z } from "zod";
import { trpcUrl } from "./_trpc";
import { trpc } from "./_trpc/client";

// export const ApplicationContext = createContext()

const ApplicationInputSchema = z.object({
  userId: z.string().optional(),
  sessionId: z.string(),
});
type ApplicationInput = z.infer<typeof ApplicationInputSchema>;

export function ApplicationProvider(props: {
  children: ReactNode;
  input: ApplicationInput;
}) {
  const store = map<any>({}); // todo define global types here

  const [queryClient] = useState(() => new QueryClient());
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

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <ApplicationContext.Provider value={store}>
          {props.children}
        </ApplicationContext.Provider>
      </QueryClientProvider>
    </trpc.Provider>
  );
}
