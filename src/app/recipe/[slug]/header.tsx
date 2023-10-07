"use client";

import { RecipeChatContext } from "@/components/recipe-chat";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useSelector } from "@/hooks/useSelector";
import { ArrowBigUpDashIcon, PrinterIcon, SaveIcon } from "lucide-react";
import { useCallback, useContext, useState } from "react";

export default function Header() {
  const actor = useContext(RecipeChatContext);
  // todo?

  return null;
}
