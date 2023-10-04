"use client";

import { useSelector } from "@/hooks/useSelector";
import { ReactNode, useContext } from "react";
import { HeaderContext } from "./header";

export default function Body(props: { children: ReactNode }) {
  const headerActor = useContext(HeaderContext);
  const headerIsFloating = useSelector(headerActor, (state) =>
    state.matches("Position.Floating")
  );
  return (
    <main
      className={`flex w-full flex-1 ${
        headerIsFloating ? "pt-16" : ""
      } max-h-full overflow-hidden`}
    >
      {props.children}
    </main>
  );
}
