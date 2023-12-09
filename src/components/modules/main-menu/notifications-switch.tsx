"use client";

import { Switch } from "@/components/input/switch";
import { useCallback, useState } from "react";

export const NotificationsSwitch = () => {
  const [checked, setChecked] = useState(false);
  const handleCheckedChange = useCallback(() => {
    setChecked(!checked);
  }, [checked, setChecked]);

  return <Switch checked={checked} onCheckedChange={handleCheckedChange} />;
};
