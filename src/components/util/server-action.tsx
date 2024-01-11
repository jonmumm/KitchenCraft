"use client";

import { useEffect, useRef } from "react";

// Self-executing server action
export const ServerAction = ({ action }: { action: () => Promise<any> }) => {
  const init = useRef(false);
  useEffect(() => {
    if (!init.current) {
      action();
      init.current = true;
    }
  }, [init, action]);
  return <></>;
};
