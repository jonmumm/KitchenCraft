import Bowser from "bowser";
import { headers } from "next/headers";
import CraftCommand, {
  CraftContextProvider,
  DesktopCommandDialog,
  MobileCommandSheet,
} from "./components";

export default function Page({
  searchParams,
}: {
  searchParams: Record<string, string>;
}) {
  const headerList = headers();
  const browser = Bowser.getParser(headerList.get("user-agent")!);
  return (
    <CraftContextProvider searchParams={searchParams}>
      {browser.getPlatformType() === "desktop" && (
        <DesktopCommandDialog>
          <CraftCommand />
        </DesktopCommandDialog>
      )}
      {browser.getPlatformType() === "mobile" && (
        <MobileCommandSheet>
          <CraftCommand />
        </MobileCommandSheet>
      )}
    </CraftContextProvider>
  );
}
