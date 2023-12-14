"use client";

import { Button } from "@/components/input/button";
import { getPlatformInfo } from "@/lib/device";
import { ArrowLeftIcon } from "lucide-react";
import Link from "next/link";
import { ReactNode, useEffect, useState } from "react";

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

export const BrowserBackButton = ({
  handleBack,
}: {
  handleBack: () => Promise<void>;
}) => {
  const [showLink, setShowLink] = useState(true);

  useEffect(() => {
    setShowLink(false);
  }, [showLink]);

  const Content = () => (
    <Button
      variant="ghost"
      type="submit"
      onClick={() => {
        !showLink && window.history.back();
      }}
    >
      <ArrowLeftIcon />
    </Button>
  );

  return showLink ? (
    <form action={handleBack}>
      <Content />
    </form>
  ) : (
    <Content />
  );
};
