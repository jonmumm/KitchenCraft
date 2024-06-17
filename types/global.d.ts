import en from "../messages/en.json";
interface Window {
  adsbygoogle: { [key: string]: unknown }[];
}

type Messages = typeof en;
declare global {
  // Use type safe message keys with `next-intl`
  interface IntlMessages extends Messages {}
}
