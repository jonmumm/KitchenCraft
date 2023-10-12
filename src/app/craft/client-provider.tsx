"use client";

import { ReactNode } from "react";

// Sets up everything the client needs for the recipe page
// accepts only serializable data
export default function Provider(props: { children: ReactNode }) {
  return <>{props.children}</>;
}
