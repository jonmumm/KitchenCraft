"use client";

import { ApplicationContext } from "@/context/application";
import { useActor } from "@/hooks/useActor";
import { map } from "nanostores";
import { ReactNode } from "react";
import { HeaderContext, createHeaderMachine } from "./header";

// export const ApplicationContext = createContext()

// const ApplicationInputSchema = z.object({
//   userId: z.string().optional(),
//   sessionId: z.string(),
// });
// type ApplicationInput = z.infer<typeof ApplicationInputSchema>;

export function ApplicationProvider(props: { children: ReactNode }) {
  const store = map<any>({}); // todo define global types here

  return (
    <ApplicationContext.Provider value={store}>
      <HeaderProvider>{props.children}</HeaderProvider>
    </ApplicationContext.Provider>
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
