import { Label } from "@/components/display/label";
import { Separator } from "@/components/display/separator";
import { Button } from "@/components/input/button";
import ScrollLockComponent from "@/components/scroll-lock";
import { adapter, authOptions, emailConfig } from "@/lib/auth/options";
import { getCurrentEmail } from "@/lib/auth/session";
import { createHash, randomString } from "@/lib/string";
import { cn } from "@/lib/utils";
import {
  ArrowDownCircleIcon,
  ArrowUpCircleIcon,
  PlusSquareIcon,
  ShareIcon,
} from "lucide-react";
import Image from "next/image";
import { redirect } from "next/navigation";
import { FC } from "react";
import { BackButton } from "../@header/components.client";

export const dynamic = "force-dynamic";

export default async function Page({
  searchParams,
}: {
  searchParams: Record<string, string>;
}) {
//   const currentEmail = await getCurrentEmail();
//   // todo allow this to work if not logged in...
//   if (!currentEmail) {
//     redirect(`/auth/signin?callbackUrl=${encodeURIComponent("/app")}`);
//   }

//   let oneTimeToken = searchParams["ott"];
//   const emailParam = searchParams["email"];
//   console.log(emailParam);
//   if (!oneTimeToken || currentEmail !== emailParam) {
//     oneTimeToken = randomString(32);
//     const secret = emailConfig.secret || authOptions.secret;
//     const FIVE_MINUTES_IN_SECONDS = 300;
//     const expires = new Date(Date.now() + FIVE_MINUTES_IN_SECONDS * 1000);
//     const token = await createHash(`${oneTimeToken}${secret}`);

//     // todo only do this if one doesnt already exist, otherwise we'll span create our db
//     await adapter.createVerificationToken?.({
//       identifier: currentEmail,
//       token,
//       expires,
//     });

//     redirect(
//       `/app?ott=${oneTimeToken}&email=${encodeURIComponent(currentEmail)}`
//     );
//   }

  async function back() {
    "use server";
    redirect("/");
  }

  //   const secret = provider.secret ?? options.secret

  return (
    <ScrollLockComponent active={true}>
      <div className="flex flex-col justify-end absolute inset-0 gap-3">
        <div className="flex-1 flex justify-start p-4">
          <BackButton variant="outline" handleBack={back} hasHistory={false} />
        </div>
        <div className="flex flex-col gap-3 px-4 pb-4">
          <h1 className="font-semibold text-xl text-center">
            Craft from your Home Screen
          </h1>
          <p className="text-muted-foreground text-sm text-center">
            Get notified about fresh recipes, trends, and bestselling products.
          </p>
          <div className="w-24 h-24 mx-auto bg-black rounded-xl shadow-xl">
            <Image
              alt="KitchenCraft App Icon"
              width={512}
              height={512}
              src="/apple-touch-icon.png"
            />
          </div>
        </div>
        <Separator />
        <div className="flex flex-col gap-3 px-4 pb-12">
          <Label className="text-muted-foreground text-xs uppercase">
            Steps To Install
          </Label>
          {/* <div>{currentEmail} {oneTimeToken}</div> */}
          <div className="flex flex-row items-center gap-2">
            1. Press{" "}
            <pre
              className="border-slate-300 dark:border-slate-700 border-2 border-solid"
              style={{
                display: "inline-flex",
                alignItems: "center",
                borderRadius: "4px",
                padding: "5x",
                paddingLeft: "10px",
              }}
            >
              Share
              <Button size="icon" disabled variant="ghost">
                <ShareIcon />
              </Button>
            </pre>{" "}
          </div>
          <div className="flex flex-row items-center gap-2">
            2. Press{" "}
            <pre
              className="border-slate-300 dark:border-slate-700 border-2 border-solid"
              style={{
                display: "inline-flex",
                alignItems: "center",
                borderRadius: "4px",
                padding: "5x",
                paddingLeft: "10px",
              }}
            >
              Add to Home Screen
              <Button size="icon" variant="ghost" disabled>
                <PlusSquareIcon />
              </Button>
            </pre>
          </div>
          <div className="my-3">
            <Image
              style={{
                width: "100%",
                border: "1px solid #ccc",
                borderRadius: "6px",
              }}
              height={1170}
              width={338}
              src="/a2hs_safari.jpg"
              alt="Add to Home Screen Example"
            />
          </div>
        </div>
        <PWAInstallViaA2HSAttentionPulse />
      </div>
    </ScrollLockComponent>
  );
}

const PWAInstallViaA2HSAttentionPulse: FC<{
  className?: string;
  direction?: "up" | "down";
}> = ({ className, direction }) => {
  return (
    <div
      className={cn(
        `absolute bottom-2 flex justify-center left-0 right-0 animate-bounce`,
        className
      )}
    >
      <div>
        {direction === "up" ? <ArrowUpCircleIcon /> : <ArrowDownCircleIcon />}
      </div>
    </div>
  );
};
