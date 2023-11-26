import { FC, ReactNode, createContext, useCallback, useContext } from "react";
import { Badge } from "./display/badge";
import { createActor, createMachine } from "xstate";
import { useSelector } from "@/hooks/useSelector";
import { RecipeAttribute } from "@/types";

export const AttributeBadge: FC<{
  children: ReactNode;
  attrType: string;
  attrKey: string;
}> = ({ attrKey, attrType, children }) => {
  // const { actor } = useContext(AppContext);

  // const attrVal = useSelector(actor, (state) => {
  //   const attributes = state.context.attributes[attrType as RecipeAttribute];
  //   if (typeof attributes === "object" && attrKey) {
  //     return attributes[attrKey];
  //   } else if (typeof attributes === "string" && attrKey) {
  //     return attributes === attrKey;
  //   }
  // });

  const handlePress = useCallback(() => {
    // actor.send({
    //   type: "TOGGLE_ATTRIBUTE",
    //   attrType,
    //   attrKey,
    // });
  }, []);
  const attrVal = false;

  return (
    <Badge
      className={`${!attrVal ? "bg-gray-500" : "bg-gray-900"}`}
      onClick={handlePress}
    >
      {children}
    </Badge>
  );
};
