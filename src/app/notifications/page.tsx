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
import EventTrigger from "@/components/input/event-trigger";
import { Switch } from "@/components/input/switch";
import { AppInstallContainer } from "@/components/modules/main-menu/app-install-container";
import NavigationLink from "@/components/navigation/navigation-link";
import { PushSubscriptions, db } from "@/db";
import { env } from "@/env.public";
import { privateEnv } from "@/env.secrets";
import { getCurrentEmail } from "@/lib/auth/session";
import { parseCookie, setCookie } from "@/lib/coookieStore";
import { getCanInstallPWA } from "@/lib/headers";
import { assert } from "@/lib/utils";
import { Loader2Icon } from "lucide-react";
import Image from "next/image";
import { redirect } from "next/navigation";
import * as webpush from "web-push";

export default async function Page() {
  // const distinctId = await getDistinctId();
  const currentEmail = await getCurrentEmail();
  const canInstallPWA = getCanInstallPWA();

  const appSessionId = parseCookie("appSessionId");
  const appNotInstalled = !appSessionId;
  const permissionStatePush = parseCookie("permissionState:push");

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
          {appSessionId && permissionStatePush !== "granted" ? (
            <NavigationLink
              href="/push-notifications"
              className="flex flex-col gap-1 items-center"
            >
              <Switch id="push-new-releases" className="transitioning:hidden" />
              <Loader2Icon className="animate-spin transitioning:block hidden" />
              <Label className="text-xs text-muted-foreground">Push</Label>
            </NavigationLink>
          ) : canInstallPWA && appNotInstalled ? (
            <EventTrigger
              className="flex flex-col gap-1 items-center"
              event={{ type: "DOWNLOAD_APP" }}
            >
              <Switch disabled className="pointer-events-none" id="push-new-releases" />
              <Label className="text-xs text-muted-foreground">Push</Label>
            </EventTrigger>
          ) : (
            <div className="flex flex-col gap-1 items-center">
              <Switch id="push-new-releases" />
              <Label className="text-xs text-muted-foreground">Push</Label>
            </div>
          )}
          {currentEmail ? (
            <div className="flex flex-col gap-1 items-center">
              <Switch id="email-new-releases" />
              <Label className="text-xs text-muted-foreground">Email</Label>
            </div>
          ) : (
            <NavigationLink
              href={`/auth/signin?message=${encodeURIComponent(
                "Sign in to enable email notifications."
              )}&callbackUrl=${encodeURIComponent("/notifications")}`}
              className="flex flex-col gap-1 items-center"
            >
              <Switch
                id="email-new-releases"
                className="transitioning:hidden"
              />
              <Loader2Icon className="animate-spin transitioning:block hidden" />
              <Label className="text-xs text-muted-foreground">Email</Label>
            </NavigationLink>
          )}
        </div>
      </div>
    );
  };

  return (
    <main className="flex flex-col items-center justify-center h-full p-4 md:p-8">
      <Card className="w-full max-w-2xl flex flex-col">
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
          <CardDescription>
            Customize your notification preferences.
          </CardDescription>
        </CardHeader>
        {appSessionId && permissionStatePush !== "granted" && (
          <>
            <Separator />
            <div className="p-4">
              <div className="text-center">
                <Badge variant="warning">Push Not Enabled</Badge>
                <p className="text-muted-foreground text-sm">
                  Enable push to receive the latest
                </p>
              </div>
              <ul className="flex flex-col gap-1 m-4">
                <li>🍳 Recipe trends</li>
                <li>🔪 Cooking tips and tricks</li>
                <li>🛒 Bestselling tools and ingredients</li>
                <li>🌟 Top voted recipes</li>
                <li>🏆 Seasonal awards for top chefs</li>
              </ul>
              <Button className="w-full">Enable Push</Button>
            </div>
            <Separator className="mb-4" />
          </>
        )}
        {!appSessionId && getCanInstallPWA() && (
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
              Add the KitchenCraft App to enable push notifications on your
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
