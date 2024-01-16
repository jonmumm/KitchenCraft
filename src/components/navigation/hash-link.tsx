"use client";

import { useSend } from "@/hooks/useSend";
import Link from "next/link";
import {
  ComponentProps,
  MouseEventHandler,
  forwardRef,
  useCallback,
} from "react";

// This is to takeover from next router which doesnt handle hashes quickly
const HashLink = forwardRef(
  ({ href, ...props }: ComponentProps<typeof Link> & { href: string }, ref) => {
    // todo assert hash follows form
    const send = useSend();
    const handleClick: MouseEventHandler = useCallback(
      (e) => {
        send({ type: "HASH_CHANGE", hash: href });
        e.preventDefault();
        e.stopPropagation();
        const { pathname, search } = window.location;
        const newUrl = pathname + search + href;
        window.history.replaceState(null, "", newUrl);
      },
      [href, send]
    );

    return (
      <Link
        {...props}
        href={href}
        ref={ref as any} // Add the forwarded ref here
        onClick={handleClick}
      >
        {props.children}
      </Link>
    );
  }
);

export default HashLink;
