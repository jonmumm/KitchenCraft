import Bowser from "bowser";
import { headers } from "next/headers";

export const getOrigin = () => {
  const headersList = headers();
  const host = headersList.get("host");
  const protocol =
    host?.startsWith("localhost") || host?.startsWith("127.0.0.1")
      ? `http://`
      : `https://`;
  const origin = `${protocol}${host}`;
  return origin;
};

export const getReferer = () => {
  const headersList = headers();
  return headersList.get("referer");
};

export const getUserAgent = () => {
  const headersList = headers();
  return headersList.get("user-agent")!;
};

export const getBrowser = () => {
  const userAgent = getUserAgent();
  return Bowser.getParser(userAgent);
};

export const getIsMacDesktop = () => {
  return (
    getBrowser().getPlatformType() === "desktop" &&
    getBrowser().getOSName() === "macOS"
  );
};
