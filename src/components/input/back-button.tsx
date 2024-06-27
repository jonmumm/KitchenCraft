"use client";

import { useAppContext } from "@/hooks/useAppContext";
import { useSend } from "@/hooks/useSend";
import { selectCanGoBack } from "@/selectors/app.selectors";
import { Slot } from "@radix-ui/react-slot";
import { useRouter } from "next/navigation";
import React, { forwardRef } from "react";
import { Button, ButtonProps } from "./button";

interface BackButtonProps extends Omit<ButtonProps, "onClick"> {
  asChild?: boolean;
  children: React.ReactNode;
  // fallbackLocation?: string;
}

export const BackButton = forwardRef<HTMLButtonElement, BackButtonProps>(
  ({ asChild, children, className, variant = "outline", ...props }, ref) => {
    const Comp = asChild ? Slot : Button;
    const send = useSend();
    const router = useRouter();
    const app$ = useAppContext();

    const handleClick = React.useCallback(
      (e: React.MouseEvent<HTMLButtonElement>) => {
        const canGoBack = selectCanGoBack(app$.getSnapshot());
        if (canGoBack) {
          router.back();
          send({ type: "BACK" });
        } else {
          router.push("/");
        }
      },
      [send, router, app$]
    );

    return (
      <Comp
        onClick={handleClick}
        className={className}
        variant={variant}
        ref={ref}
        {...props}
      >
        {children}
      </Comp>
    );
  }
);

BackButton.displayName = "BackButton";
