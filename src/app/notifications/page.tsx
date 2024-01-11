import { Badge } from "@/components/display/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/display/card";
import { Label } from "@/components/display/label";
import { Separator } from "@/components/display/separator";
import { Button } from "@/components/input/button";
import { Switch } from "@/components/input/switch";
import { AppInstallContainer } from "@/components/modules/main-menu/app-install-container";
import { PushSubscriptions, db } from "@/db";
import { env } from "@/env.public";
import { privateEnv } from "@/env.secrets";
import { getDistinctId } from "@/lib/auth/session";
import { parseCookie, setCookie } from "@/lib/coookieStore";
import { getCanInstallPWA } from "@/lib/headers";
import { assert } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import * as webpush from "web-push";

export default async function Page() {
  const distinctId = await getDistinctId();

  const appSessionId = parseCookie("appSessionId");
  const missingPushPermission =
    parseCookie("permissionState:push") !== "granted";

  async function refreshPushSubscription(
    distinctId: string,
    subscription: PushSubscriptionJSON
  ): Promise<void> {
    "use server";
    setCookie("permissionState:push", "granted");
    redirect("/");
  }

  async function registerPushSubscription(
    distinctId: string,
    subscription: PushSubscriptionJSON
  ): Promise<void> {
    "use server";

    setCookie("permissionState:push", "granted");

    const { endpoint, keys, expirationTime } = subscription;
    console.log(expirationTime);
    assert(endpoint, "expected endpoint in push subscription payload");
    assert(keys, "expected keys in push subscription payload");
    assert("auth" in keys, "expetcted 'auth' in keys");
    assert("p256dh" in keys, "expected 'p256dh' in keys");
    const { auth, p256dh } = keys;

    const options = {
      vapidDetails: {
        subject: "mailto:push@kitchencraft.ai",
        publicKey: env.VAPID_PUBLIC_KEY,
        privateKey: privateEnv.VAPID_PRIVATE_KEY,
      },
    };

    await webpush.sendNotification(
      {
        endpoint,
        keys: {
          auth,
          p256dh,
        },
      },
      JSON.stringify({ title: "Success!" }),
      options
    );

    await db
      .insert(PushSubscriptions)
      .values({
        belongsTo: distinctId,
        subscription,
      })
      .execute();

    redirect("/");
  }

  return (
    <main className="flex flex-col items-center justify-center h-full p-4 md:p-8">
      <Card className="w-full max-w-2xl flex flex-col">
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
          <CardDescription>
            Customize your notification preferences.
          </CardDescription>
        </CardHeader>
        {appSessionId && missingPushPermission && (
          <>
            <Separator />
            <div className="p-4">
              <h1 className="font-semibold text-lg text-center">
                Push Notifications
              </h1>
              <p className="text-muted-foreground text-sm text-center">
                Enable KitchenCraft to send the latest
              </p>
              <ul className="flex flex-col gap-1 m-4">
                <li>🍳 Recipe trends</li>
                <li>🔪 Cooking tips and tricks</li>
                <li>🛒 Bestselling tools and ingredients</li>
                <li>🌟 Top voted recipes</li>
                <li>🏆 Seasonal awards for top chefs</li>
              </ul>
              <Link href="/push-notifications">
                <Button className="w-full">Enable</Button>
              </Link>
            </div>
            <Separator className="mb-4" />
          </>
        )}
        {getCanInstallPWA() && (
          <AppInstallContainer>
            <Separator />
            <div className="p-4">
              <Button
                className="text-xs h-fit flex flex-row gap-4 rounded-xl py-4 mx-auto shadow-xl"
                event={{ type: "DOWNLOAD_APP" }}
                variant="outline"
              >
                <Image
                  src={"/apple-touch-icon.png"}
                  className="h-14 w-14"
                  alt={"App Icon"}
                  width={512}
                  height={512}
                />
                <div className="flex flex-col gap-1 items-center">
                  <Badge
                    className="text-blue-600 dark:text-blue-400"
                    variant="secondary"
                  >
                    Get
                  </Badge>
                  <span className="text-lg font-medium">KitchenCraft App</span>
                </div>
              </Button>
            </div>
            <p className="text-muted-foreground text-sm px-5 pb-4 text-center">
              Add the KitchenCraft App to receive push notifications on your
              device.
            </p>
            <Separator className="mb-8" />
          </AppInstallContainer>
        )}
        <CardContent className="flex flex-col gap-5">
          <NotificationItem
            title={"Recipe Digest"}
            description={"Receive updates on trending recipes"}
          />
          <NotificationItem
            title={"Bestsellers"}
            description={"Stay informed about the most popular products"}
          />
          <NotificationItem
            title={"Discover Weekly"}
            description={
              "Weekly recommendations of new and interesting recipes"
            }
          />
        </CardContent>
      </Card>
    </main>
  );
}

const NotificationItem = ({
  title,
  description,
}: {
  title: string;
  description: string;
}) => {
  return (
    <div className="flex flex-row justify-between">
      <div className="flex flex-col gap-1">
        <div className="font-medium">{title}</div>
        <div className="text-sm text-gray-500">{description}</div>
      </div>
      <div className="flex justify-end space-x-4">
        <div className="flex flex-col gap-1 items-center">
          <Switch id="push-new-releases" />
          <Label className="text-xs text-muted-foreground">Push</Label>
        </div>
        <div className="flex flex-col gap-1 items-center">
          <Switch id="email-new-releases" />
          <Label className="text-xs text-muted-foreground">Email</Label>
        </div>
      </div>
    </div>
  );
};
