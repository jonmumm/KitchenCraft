"use client";

import { Card } from "@/components/ui/card";
import { ChevronsRightIcon } from "lucide-react";
import { ReactNode, useCallback } from "react";
import { cn } from "@/lib/utils";
import { useSend } from "@/hooks/useSend";

export const IdeaListItemCard = ({
  children,
  className,
  name,
  description,
}: {
  children: ReactNode;
  className?: string;
  name: string;
  description: string;
}) => {
  const send = useSend();

  const handlePressClick = useCallback(() => {
    send({ type: "SELECT_RELATED_IDEA", name, description });
  }, [send]);

  return (
    <Card onClick={handlePressClick} className={className}>
      {children}
    </Card>
  );
};
