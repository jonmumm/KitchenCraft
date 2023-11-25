import Script, { ScriptProps } from "next/script";

const PUBLISHER_ID_REGEX = /^pub-\d{16}$/;

type GoogleAdSenseProps = {
  strategy?: ScriptProps["strategy"];
  debug?: boolean;
};

export function GoogleAdSense({}: GoogleAdSenseProps): JSX.Element | null {
  return (
    <Script
      async
      src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js"
      strategy="afterInteractive"
    />
  );
}
