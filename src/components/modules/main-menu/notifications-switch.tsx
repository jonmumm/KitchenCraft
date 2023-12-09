"use client";

import { Switch } from "@/components/input/switch";
import { getFeatures } from "@/lib/device";
import { ReactNode, useCallback, useEffect, useState } from "react";

export const NotificationsSetting = ({ children }: { children: ReactNode }) => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const { hasPush } = getFeatures(navigator.userAgent);
    if (hasPush) {
      setShow(true);
    }
  }, [setShow]);

  return !show ? <>{children}</> : <></>;
};

export const NotificationsSwitch = () => {
  const [checked, setChecked] = useState(false);
  const handleCheckedChange = useCallback(() => {
    setChecked(!checked);
  }, [checked, setChecked]);

  return <Switch checked={checked} onCheckedChange={handleCheckedChange} />;
};
