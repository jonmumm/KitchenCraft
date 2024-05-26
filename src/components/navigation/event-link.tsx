"use client";

import { useSend } from "@/hooks/useSend";
import { AppEvent } from "@/types";
import Link from "next/link";
import { ComponentProps, MouseEventHandler, useCallback } from "react";

export const EventLink = ({
  event,
  ...props
}: ComponentProps<typeof Link> & { event: AppEvent }) => {
  const send = useSend();

  const handleClick: MouseEventHandler<HTMLAnchorElement> = useCallback(
    (e) => {
      send(event);
      e.preventDefault();
      e.stopPropagation();
    },
    [event, send]
  );

  return (
    <Link {...props} onClick={handleClick}>
      {props.children}
    </Link>
  );
};
