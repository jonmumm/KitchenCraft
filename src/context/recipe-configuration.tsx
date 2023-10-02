import { FC, ReactNode, createContext, useState } from "react";
import { createActor, createMachine } from "xstate";

export const RecipeConfigurationProvider: FC<{
  initialMessages: { content: string; role: "user" | "assistant" | "system" }[];
  children: ReactNode;
}> = ({ initialMessages, children }) => {
  const value = "";

  const [actor] = useState(
    createActor(createMachine({
      id: "RecipeConfiguration",
      initial: "Untouched",
      states: {
        Untouched: {},
        Touched: {},
        Submitted: {},
        Streaming: {},
      }
    }))
  );

  const useActor = () => actor;

  const [Context] = useState(createContext({
    useActor,
  }));

  return <Context.Provider value={value}>{children}</Context.Provider>;
};
