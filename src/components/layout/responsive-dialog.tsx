"use client";

import { Dialog, DialogContent } from "@/components/layout/dialog";
import { Sheet, SheetContent, SheetOverlay } from "@/components/layout/sheet";
import { cn } from "@/lib/utils";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import * as SheetPrimitive from "@radix-ui/react-dialog";
import { DialogOverlay } from "@radix-ui/react-dialog";
import { createContext, forwardRef, useContext } from "react";

// Creating the MobileContext
const MobileContext = createContext(false);

// ResponsiveDialog Component
const ResponsiveDialog: React.FC<
  DialogPrimitive.DialogProps & { isMobile: boolean }
> = ({ children, isMobile, ...props }) => {
  return (
    <MobileContext.Provider value={isMobile}>
      {isMobile ? (
        <Sheet {...props}>{children}</Sheet>
      ) : (
        <Dialog {...props}>{children}</Dialog>
      )}
    </MobileContext.Provider>
  );
};

// ResponsiveDialogContent Component
const ResponsiveDialogContent = forwardRef<
  HTMLDivElement,
  DialogPrimitive.DialogContentProps
>(({ children, ...props }, ref) => {
  const isMobile = useContext(MobileContext);

  return isMobile ? (
    <SheetContent
      side="bottom"
      ref={ref}
      {...props}
      className={cn("p-0", props.className)}
    >
      {children}
    </SheetContent>
  ) : (
    <DialogContent ref={ref} {...props} className={cn("p-0", props.className)}>
      {children}
    </DialogContent>
  );
});

ResponsiveDialogContent.displayName = "ResponsiveDialogContent";

// ResponsiveDialogTrigger Component
const ResponsiveDialogTrigger: React.FC<DialogPrimitive.DialogTriggerProps> = ({
  children,
  ...props
}) => {
  const isMobile = useContext(MobileContext);

  return isMobile ? (
    <SheetPrimitive.Trigger {...props}>{children}</SheetPrimitive.Trigger>
  ) : (
    <DialogPrimitive.Trigger {...props}>{children}</DialogPrimitive.Trigger>
  );
};

const ResponsiveDialogOverlay: React.FC<DialogPrimitive.DialogOverlayProps> = (
  props
) => {
  const isMobile = useContext(MobileContext);

  return isMobile ? <SheetOverlay {...props} /> : <DialogOverlay {...props} />;
};

export {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogOverlay,
  ResponsiveDialogTrigger,
};
