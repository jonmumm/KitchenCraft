"use client";

import { Button } from "@/components/input/button";
import { AxeIcon } from "lucide-react";
import { useContext } from "react";
import { RemixContext } from "./remix-context";
import { useStore } from "@nanostores/react";

export function RemixButton() {
  const store = useContext(RemixContext);
  const { prompt } = useStore(store, { keys: ["prompt"] });
  const disabled = prompt === "";

  return (
    <Button disabled={disabled} type="submit" className="w-16 h-16 rounded-xl">
      <AxeIcon />
    </Button>
  );
}
