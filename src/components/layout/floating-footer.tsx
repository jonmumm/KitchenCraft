"use client";

import ResizeObserverComponent from "@/components/resize-observer";
import { Sheet, SheetContent, SheetOverlay } from "@/components/layout/sheet";
import { useSend } from "@/hooks/useSend";
import { useStore } from "@nanostores/react";
import { atom, computed } from "nanostores";
import { ReactNode, useCallback, useEffect, useRef, useState } from "react";

type Props = {
  children: ReactNode;
  open?: boolean;
  overlay?: boolean;
  showBack?: boolean;
};

export const FloatingFooter = ({ children, open, overlay }: Props) => {
  const [contentHeight$] = useState(atom(0));
  const [translateY$] = useState(
    computed(contentHeight$, (contentHeight) => {
      return 300;
    })
  );
  const sheetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (sheetRef.current) {
      console.log("TRANSFORM!");
      sheetRef.current.style.transform = `translateY(200px)`;
    }
  }, [sheetRef]);

  // useEffect(() => {
  //   const sheet = sheetRef.current;
  //   if (!sheet) {
  //     return;
  //   }

  //   return translateY$.subscribe((y) => {
  //     console.log("TRANSFORM!", y);
  //     sheet.style.transform = `translateY(${y}px)`;
  //   });
  // }, [sheetRef.current, translateY$]);

  const snapPointsRef = useRef<number[]>([]); // Ref to store snap points
  const send = useSend();

  // Define snap points based on content height
  const defineSnapPoints = () => {
    const maxHeight = window.innerHeight;
    snapPointsRef.current = [
      maxHeight - contentHeight$.get(),
      maxHeight / 2,
      maxHeight,
    ];
  };

  const handleResize = useCallback(
    ({ height }: { height: number }) => {
      contentHeight$.set(height);
    },
    [contentHeight$]
  );

  const handlePointerDownOutside = useCallback(() => {
    send({ type: "CLOSE" });
  }, [send]);

  // Implement drag logic here
  const handleDragStart = useCallback(/* ... */ () => {}, []);
  const handleDragMove = useCallback(/* ... */ () => {}, []);
  const handleDragEnd = useCallback(/* ... */ () => {}, []);

  const Spacer = () => {
    const height = useStore(contentHeight$);
    return <div style={{ height }} className="w-full"></div>;
  };

  // Calculate style for SheetContent based on translateY

  return (
    <>
      <Sheet open={open}>
        <SheetContent
          side="bottom"
          ref={sheetRef}
          style={{ height: "600px" }}
          onPointerDownOutside={handlePointerDownOutside}
          onDragStart={handleDragStart}
          onDrag={handleDragMove}
          onDragEnd={handleDragEnd}
        >
          <ResizeObserverComponent onResize={handleResize}>
            {children}
          </ResizeObserverComponent>
        </SheetContent>
        {overlay && <SheetOverlay />}
      </Sheet>
      {/* {open && <Spacer />} */}
    </>
  );
};

// export const FloatingFooter = ({ children, open, overlay }: Props) => {
//   const contentRef = useRef(null);
//   const [height$] = useState(atom(0));
//   const send = useSend();

//   const handleResize = useCallback(
//     ({ height }: { height: number }) => {
//       height$.set(height);
//     },
//     [height$]
//   );

//   const handlePointerDownOutside = useCallback(() => {
//     console.log("down clsoe");
//     send({ type: "CLOSE" });
//   }, [send]);

//   const Spacer = () => {
//     const height = useStore(height$);
//     return <div style={{ height }} className="w-full"></div>;
//   };

//   return (
//     <>
//       <Sheet open={open}>
//         <SheetContent
//           ref={contentRef}
//           side={"bottom"}
//           onPointerDownOutside={handlePointerDownOutside}
//         >
//           <ResizeObserverComponent onResize={handleResize}>
//             {children}
//           </ResizeObserverComponent>
//         </SheetContent>
//         {overlay && <SheetOverlay />}
//       </Sheet>
//       {open && <Spacer />}
//     </>
//   );
// };
