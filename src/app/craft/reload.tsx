"use client";

import { useEffect, useTransition } from "react";

export const Reload = ({
  reloadIfMore,
}: {
  reloadIfMore: () => Promise<void>;
}) => {
  const [_, startTransition] = useTransition();
  useEffect(() => {
    startTransition(() => reloadIfMore());
  }, [startTransition, reloadIfMore]);
  return null;
};
