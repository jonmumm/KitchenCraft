"use clients";

import { CommandGroup } from "@/components/ui/command";
import { ReactNode } from "react";

export async function ConjureResults({ children }: { children?: ReactNode }) {
  // query the server to see
  return <CommandGroup heading="Results">
    {children}
  </CommandGroup>;
};
