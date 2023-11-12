"use client";

import { CraftContext } from "@/app/@craft/context";
import ResizeObserverComponent from "@/components/resize-observer";
import { Sheet, SheetContent, SheetOverlay } from "@/components/ui/sheet";
import { useSelector } from "@/hooks/useSelector";
import { useSend } from "@/hooks/useSend";
import { useStore } from "@nanostores/react";
import { atom } from "nanostores";
import { ReactNode, useCallback, useContext, useRef, useState } from "react";

type Props = {
  children: ReactNode;
  open?: boolean;
  overlay?: boolean;
  showBack?: boolean;
};

export const FloatingDock = ({ children, open, overlay }: Props) => {
  const contentRef = useRef(null);
  const [height$] = useState(atom(0));
  const send = useSend();

  const actor = useContext(CraftContext);

  const side = useSelector(actor, (state) => {
    if (state.matches("FocusState.Focused")) {
      return "top" as const;
    } else {
      return "bottom" as const;
    }
  });

  const handleResize = useCallback(
    ({ height }: { height: number }) => {
      height$.set(height);
    },
    [height$]
  );

  const handlePointerDownOutside = useCallback(() => {
    console.log("down clsoe");
    send({ type: "CLOSE" });
  }, [send]);

  const Spacer = () => {
    const height = useStore(height$);
    return <div style={{ height }} className="w-full"></div>;
  };

  return (
    <>
      <Sheet open={open}>
        <SheetContent
          ref={contentRef}
          side={side}
          onPointerDownOutside={handlePointerDownOutside}
        >
          <ResizeObserverComponent onResize={handleResize}>
            {children}
          </ResizeObserverComponent>
        </SheetContent>
        {overlay && <SheetOverlay />}
      </Sheet>
      {side === "bottom" && open && <Spacer />}
    </>
  );
};
