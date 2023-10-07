"use client";

import { useSelector } from "@/hooks/useSelector";
import { ReactNode, useContext } from "react";
import { HeaderContext } from "./header";

export default function Body(props: { children: ReactNode }) {
  const headerActor = useContext(HeaderContext);
  // const headerIsFloating = useSelector(headerActor, (state) =>
  //   state.matches("Position.Floating")
  // );
  return (
    <main className={`mx-auto max-w-lg xl:max-w-xl max-h-full w-full`}>
      {props.children}
    </main>
  );
}
