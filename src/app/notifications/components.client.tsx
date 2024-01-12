"use client";

import { Switch } from "@/components/input/switch";
import { ComponentProps, useCallback } from "react";

export const ActionSwitch = ({
  action,
  ...props
}: ComponentProps<typeof Switch> & {
  action: (value: boolean) => Promise<void>;
}) => {
  const handleCheckedChange = useCallback(
    (value: boolean) => {
      action(value);
    },
    [action]
  );

  return <Switch {...props} onCheckedChange={handleCheckedChange} />;
};
