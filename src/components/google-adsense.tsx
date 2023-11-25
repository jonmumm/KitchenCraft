import { env } from "@/env.public";
import Script, { ScriptProps } from "next/script";

const PUBLISHER_ID_REGEX = /^pub-\d{16}$/;

type GoogleAdSenseProps = {
  strategy?: ScriptProps["strategy"];
  debug?: boolean;
};

export function GoogleAdSense({
  strategy = "afterInteractive",
  debug = false,
}: GoogleAdSenseProps): JSX.Element | null {
  return (
    <>
      <Script
        id="nextjs-google-adsense"
        src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-${
          env.ADSENSE_PUBLISHER_ID
        }${debug ? `google_console=1` : ``}`}
        strategy={strategy}
      />
    </>
  );
}
