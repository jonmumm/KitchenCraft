"use client";

import { useEventHandler } from "@/hooks/useEventHandler";
import { useEvents } from "@/hooks/useEvents";
import { cn } from "@/lib/utils";
import Link from "next/link";
import {
  ComponentProps,
  MouseEventHandler,
  useCallback,
  useState,
} from "react";

const NavigationLink = (props: ComponentProps<typeof Link>) => {
  const [isDisabled, setIsDisabled] = useState(false);

  const handlePageLoad = useCallback(
    (e: any) => {
      setIsDisabled(false);
    },
    [setIsDisabled]
  );

  useEventHandler("PAGE_LOADED", handlePageLoad);
  useEventHandler("UPDATE_SEARCH_PARAMS", handlePageLoad);

  const handleClick: MouseEventHandler = useCallback(
    (e) => {
      if (props.href !== window.location.pathname) {
        if (isDisabled) {
          e.preventDefault();
          return;
        }
        setIsDisabled(true);
      }
    },
    [props, isDisabled, setIsDisabled]
  );

  return (
    <Link
      {...props}
      className={cn(props.className, isDisabled && "transitioning")}
      onClick={handleClick}
    >
      {props.children}
    </Link>
  );
};

export default NavigationLink;
