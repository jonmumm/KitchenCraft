"use client";

import { Badge } from "@/components/display/badge";
import { Button } from "@/components/input/button";
import { PlusIcon } from "lucide-react";
import { useCallback } from "react";

export const AddTagButton = () => {
  const handlePress = useCallback(() => {
    alert("add tag not yet implemented");
  }, []);

  return (
    <Badge variant="outline" onClick={handlePress}>
      <PlusIcon size={15} />
    </Badge>
  );
};
