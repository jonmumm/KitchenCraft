"use client";

import { useEventHandler } from "@/hooks/useEventHandler";
import { useEvents } from "@/hooks/useEvents";
import { PressMediaThumbSchema } from "@/schema";
import { ElementRef, ReactNode, useCallback, useEffect, useRef } from "react";
import { z } from "zod";

export const GalleryDialog = ({
  open,
  children,
}: {
  open: boolean;
  children: ReactNode;
}) => {
  const ref = useRef<ElementRef<"dialog">>(null);
  const events = useEvents();

  const handleClose = useCallback(() => {
    ref.current?.close();
  }, []);
  const handlePressMedia = useCallback(
    (event: z.infer<typeof PressMediaThumbSchema>) => {
      ref.current?.close();
    },
    []
  );

  useEventHandler("CLOSE", handleClose);
  useEventHandler("PRESS_MEDIA_THUMB", handlePressMedia);

  useEffect(() => {
    if (ref.current) {
      ref.current.showModal();
    }
  }, [ref]);

  return <dialog ref={ref}>{children}</dialog>;
};
