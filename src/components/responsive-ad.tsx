"use client";

import { env } from "@/env.public";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

declare const window: any;

type ResponsiveAdUnitProps = {
  slotId: string;
  type?: string;
  style?: any;
};

const initAd = () => {
  (window.adsbygoogle = window.adsbygoogle || []).push({});
};

export function ResponsiveAd({
  slotId,
  type = "default-ad-unit-type",
  style = {},
}: ResponsiveAdUnitProps): JSX.Element | null {
  const initRef = useRef(false);
  useEffect(() => {
    if (!initRef.current) {
      initAd();
      initRef.current = true;
    }
  }, [initRef]);

  style.display = "block";

  //   const router = useRouter();
  const pathname = usePathname();

  return (
    <div
      key={pathname.replace(/\//g, "-") + "-" + slotId + "-" + type}
      style={style}
    >
      <ins
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client={`ca-${env.ADSENSE_PUBLISHER_ID}`}
        data-ad-slot={String(slotId)}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  );
}
