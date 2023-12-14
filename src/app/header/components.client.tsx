"use client";

import { Button } from "@/components/input/button";
import { getPlatformInfo } from "@/lib/device";
import { ArrowLeftIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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

// Once the client loads, we rely on browser back calls instead of
// form action post to calculate back
export const BackButton = ({
  handleBack,
  hasHistory,
}: {
  handleBack: () => Promise<void>;
  hasHistory: boolean;
}) => {
  const [showLink, setShowLink] = useState(true);
  const router = useRouter();

  useEffect(() => {
    setShowLink(false);
  }, [showLink]);

  const Content = () => (
    <Button
      variant="ghost"
      type="submit"
      onClick={() => {
        if (hasHistory) {
          router.back();
        } else {
          router.push("/");
        }
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
