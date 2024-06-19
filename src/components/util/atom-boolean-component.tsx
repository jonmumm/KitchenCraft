import { useStore } from "@nanostores/react";
import { ReadableAtom } from "nanostores";
import { ReactNode } from "react";

export const atomBooleanComponent = (state$: ReadableAtom<boolean>) => {
  const Component = ({
    children,
    not,
  }: {
    children: ReactNode;
    not?: boolean;
  }) => {
    const state = useStore(state$);
    return (!not && state) || (not && !state) ? <>{children}</> : <></>;
  };

  Component.displayName = `AtomBooleanComponent(${state$.toString()})`;
  return Component;
};
