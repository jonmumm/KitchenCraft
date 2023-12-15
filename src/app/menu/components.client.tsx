"use client";

import { Switch } from "@/components/input/switch";
import { getFeatures, getPlatformInfo } from "@/lib/device";
import { ReactNode, useCallback, useEffect, useState } from "react";

export const AppInstallContainer = ({ children }: { children: ReactNode }) => {
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    const { isInPWA } = getPlatformInfo(navigator.userAgent);
    if (isInPWA) {
      setInstalled(true);
    }
  }, [setInstalled]);

  return !installed ? <>{children}</> : <></>;
};

export const NotificationsSetting = ({ children }: { children: ReactNode }) => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const { hasPush } = getFeatures(navigator.userAgent);
    if (hasPush) {
      setShow(true);
    }
  }, [setShow]);

  return show ? <>{children}</> : <></>;
};

export const NotificationsSwitch = () => {
  const [checked, setChecked] = useState(false);
  const handleCheckedChange = useCallback(() => {
    const next = !checked;
    setChecked(next);

    if (next) {
      // prompt for permissions from OS
    }
  }, [checked, setChecked]);

  return <Switch checked={checked} onCheckedChange={handleCheckedChange} />;
};
