"use client";

import { Badge } from "@/components/ui/badge";
import { XIcon } from "lucide-react";
import { ReactNode, useCallback, useTransition } from "react";

export const IngredientBadge = ({
  children,
  addIngredient,
}: {
  children: ReactNode;
  addIngredient: () => Promise<void>;
}) => {
  const [isPending, startTransition] = useTransition();
  const handleClick = useCallback(() => {
    startTransition(() => {
      addIngredient();
    });
  }, [startTransition, addIngredient]);

  return (
    <Badge
      aria-disabled={isPending}
      onClick={handleClick}
      variant="secondary"
      className="flex flex-row gap-1 items-center"
    >
      <span>{children}</span> <XIcon size={18} />
    </Badge>
  );
};
