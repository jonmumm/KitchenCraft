"use client";

import { ApplicationContext } from "@/context/application";
import { map } from "nanostores";
import { ReactNode } from "react";
import { z } from "zod";

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
  return (
    <ApplicationContext.Provider value={store}>
      {props.children}
    </ApplicationContext.Provider>
  );
}
