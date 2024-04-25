import { Badge } from "@/components/display/badge";
import Image from "next/image";

export default function Banner() {
  // const appSessionId = getAppSessionId();
  // const canInstallPWA = getCanInstallPWA();
  // if (!canInstallPWA || appSessionId) {
  //   return null;
  // }
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
            Take The Quiz
          </h1>
          <p className="text-xs text-center text-slate-400">
            For personalized recipe results
          </p>
        </div>
        <div>
          <Badge
            className="text-white dark:text-white"
            variant="success"
            event={{ type: "START_ONBOARDING" }}
          >
            START
          </Badge>
        </div>
      </div>
    </div>
  );
}
