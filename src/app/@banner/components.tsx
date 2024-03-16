import { Badge } from "@/components/display/badge";
import { getAppSessionId, getCanInstallPWA } from "@/lib/headers";
import Image from "next/image";

export default async function Banner() {
  const appSessionId = getAppSessionId();
  const canInstallPWA = getCanInstallPWA();
  console.log({ appSessionId });
  if (!canInstallPWA || appSessionId) {
    return null;
  }
  return (
    <div className="bg-black flex flex-row gap-2 px-4 py-2 items-center justify-center">
      <div className="w-8 bg-black">
        <Image
          alt="KitchenCraft App Icon"
          width={512}
          height={512}
          className="rounded-sm"
          style={{
            border: "1px solid #640F89",
            // boxShadow: "0px 1px 2px #9415CA",
          }}
          src="/apple-touch-icon.png"
        />
      </div>
      <div className="flex flex-row justify-between w-full items-center">
        <div className="flex flex-col items-start justify-center h-100">
          <h1 className="font-semibold text-sm text-slate-50 leading-5">
            KitchenCraft App
          </h1>
          <p className="text-xs text-center text-slate-400">
            Craft from your Home Screen
          </p>
        </div>
        <div>
          <Badge
            className="text-white dark:text-white"
            variant="success"
            event={{ type: "DOWNLOAD_APP" }}
          >
            OPEN
          </Badge>
        </div>
      </div>
    </div>
  );
}
