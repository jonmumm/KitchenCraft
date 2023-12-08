import Bowser from "bowser";
import { headers } from "next/headers";
import CraftCommand, {
  CraftContextProvider,
  CraftSheetContent,
  DesktopCommandDialog,
  MobileCommandSheet,
} from "./components";
import { CraftContext } from "./context";
import { Sheet } from "@/components/layout/sheet";

export default function Page({
  searchParams,
}: {
  searchParams: Record<string, string>;
}) {
  const headerList = headers();
  const browser = Bowser.getParser(headerList.get("user-agent")!);
  console.log(browser.getPlatformType());
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
