"use client";

import Link, { LinkProps } from "next/link";
import { useRouter } from "next/navigation";
import {
  MouseEventHandler,
  ReactNode,
  forwardRef,
  useCallback,
  useEffect,
  useRef,
} from "react";

const RouterLink = forwardRef(
  (
    {
      children,
      href,
      ...props
    }: LinkProps & { children: ReactNode; className: string },
    ref
  ) => {
    const router = useRouter();
    const handleClick: MouseEventHandler<HTMLAnchorElement> = useCallback(
      (e) => {
        router.push(href.toString());
        e.preventDefault();
      },
      [router, href]
    );

    return (
      <Link href={href} {...props} onClick={handleClick}>
        {children}
      </Link>
    );
  }
);

RouterLink.displayName = "RouterLink";

export default RouterLink;
