"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

/* Perform a redirect by calling a server action */
export function ClientRedirect(props: { to: string }) {
  const router = useRouter();
  useEffect(() => {
    router.push(props.to);
  }, [router, props.to]);
  return null;
}
