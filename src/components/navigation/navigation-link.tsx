"use client";

import { useEventHandler } from "@/hooks/useEventHandler";
import { cn } from "@/lib/utils";
import Link from "next/link";
import {
  ComponentProps,
  MouseEventHandler,
  forwardRef,
  useCallback,
  useState,
} from "react";

const NavigationLink = forwardRef((props: ComponentProps<typeof Link>, ref) => {
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
      ref={ref as any} // Add the forwarded ref here
      className={cn(props.className, isDisabled && "transitioning")}
      onClick={handleClick}
    >
      {props.children}
    </Link>
  );
});

export default NavigationLink;
