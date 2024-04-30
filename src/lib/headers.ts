import { env } from "@/env.public";
import Bowser from "bowser";
import { headers } from "next/headers";
import { parseCookie } from "./coookieStore";
import { assert } from "./utils";

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

export const getRefererPath = () => {
  const referer = getReferer();
  return referer?.split(env.KITCHENCRAFT_URL)[1];
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

export const getCanInstallPWA = () => {
  const headerList = headers();
  const browser = Bowser.getParser(headerList.get("user-agent")!);
  return (
    browser.getOSName() === "iOS" &&
    (browser.getBrowserName() === "Safari" ||
      browser.getBrowserName() === "Chrome")
  );
};

export const getAppSessionId = () => {
  return parseCookie("appSessionId");
};

export const getIsMobile = () => {
  const browser = getBrowser();
  return browser.getPlatformType() === "mobile";
};

export const getTimezone = () => {
  const headerList = headers();
  const timezone = headerList.get("x-timezone");
  assert(timezone, "expected timezone in ehader");
  return timezone;
};