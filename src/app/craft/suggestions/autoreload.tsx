"use client";

import { useEffect } from "react";

export default function AutoReload({
  reload,
  delay,
}: {
  reload: () => Promise<boolean>;
  delay: number;
}) {
  useEffect(() => {
    let timeout: NodeJS.Timeout | undefined;
    const doReload = () => {
      reload().then((cont) => {
        if (cont) {
          timeout = setTimeout(doReload, delay);
        }
      });
    };

    timeout = setTimeout(doReload, delay);

    return () => {
      clearTimeout(timeout);
    };
  }, [reload, delay]);

  return null;
}
