"use client";

import { useEventHandler } from "@/hooks/useEventHandler";
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

  const handlePageLoad = useCallback(() => {
    setIsDisabled(false);
  }, []);

  useEventHandler("PAGE_LOADED", handlePageLoad);

  const handleClick: MouseEventHandler = useCallback(
    (e) => {
      console.log(e.button);
      if (props.href !== window.location.pathname) {
        if (isDisabled) {
          e.preventDefault();
          return;
        }
        setIsDisabled(true);
      }
    },
    [props, isDisabled]
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
