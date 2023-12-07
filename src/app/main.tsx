"use client";

import { ReactNode } from "react";

export default function Body(props: { children: ReactNode }) {
  // const headerIsFloating = useSelector(headerActor, (state) =>
  //   state.matches("Position.Floating")
  // );
  return <main className={`max-h-full flex-1`}>{props.children}</main>;
}
