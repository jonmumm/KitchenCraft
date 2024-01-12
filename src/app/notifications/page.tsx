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
import { db } from "@/db";
import { getNotificationFeatureStates } from "@/db/queries";
import { getCurrentEmail, getDistinctId } from "@/lib/auth/session";
import { parseCookie } from "@/lib/coookieStore";
import { getCanInstallPWA } from "@/lib/headers";
import { FeatureId } from "@/types";
import { Loader2Icon } from "lucide-react";
import Image from "next/image";
import { NotificationSwitch } from "./components";
import { NotificationType } from "./constants";

export default async function Page() {
  const distinctId = await getDistinctId();
  const currentEmail = await getCurrentEmail();
  const canInstallPWA = getCanInstallPWA();
  const featureStates = await getNotificationFeatureStates(db, distinctId);
  const featureStateById = featureStates.reduce(
    (acc, featureState) => {
      const { featureId } = featureState;

      if (!acc[featureId]) {
        acc[featureId] = featureState.enabled;
      }

      return acc;
    },
    {} as Partial<Record<FeatureId, boolean>>
  );

  const appSessionId = parseCookie("appSessionId");
  const appNotInstalled = !appSessionId;
  const permissionStatePush = parseCookie("permissionState:push");

  const NotificationItem = ({
    title,
    description,
    notificationType,
  }: {
    title: string;
    description: string;
    notificationType: NotificationType;
  }) => {
    const emailKey =
      `email:${notificationType}` as keyof typeof featureStateById;
    const pushKey = `push:${notificationType}` as keyof typeof featureStateById;
    const emailIsChecked = featureStateById[emailKey];
    const pushIsChecked = featureStateById[pushKey];

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
              <Switch disabled className="pointer-events-none" />
              <Label className="text-xs text-muted-foreground">Push</Label>
            </EventTrigger>
          ) : (
            <div className="flex flex-col gap-1 items-center">
              <NotificationSwitch
                notificationType={notificationType}
                channel={"push"}
                distinctId={distinctId}
                defaultChecked={
                  typeof pushIsChecked !== "undefined" ? pushIsChecked : true
                }
              />
              <Label className="text-xs text-muted-foreground">Push</Label>
            </div>
          )}
          {currentEmail ? (
            <div className="flex flex-col gap-1 items-center">
              <NotificationSwitch
                notificationType={notificationType}
                channel={"email"}
                distinctId={distinctId}
                defaultChecked={
                  typeof emailIsChecked !== "undefined" ? emailIsChecked : true
                }
              />
              <Label className="text-xs text-muted-foreground">Email</Label>
            </div>
          ) : (
            <NavigationLink
              href={`/auth/signin?message=${encodeURIComponent(
                "Sign in to enable email notifications."
              )}&callbackUrl=${encodeURIComponent("/notifications")}`}
              className="flex flex-col gap-1 items-center"
            >
              <Switch className="transitioning:hidden" />
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
            notificationType="trends"
            title={"Recipe Digest"}
            description={"Weekly digest on latest seasonal trends"}
          />
          <NotificationItem
            notificationType="products"
            title={"Bestsellers"}
            description={"Stay informed about the most popular products"}
          />
          <NotificationItem
            notificationType="top_recipes"
            title={"Discover Weekly"}
            description={
              "Weekly recommendations of new and interesting recipes"
            }
          />
          <NotificationItem
            notificationType="tips_and_tricks"
            title={"Tips & Tricks"}
            description={
              "Weekly recommendations of new and interesting recipes"
            }
          />
          <NotificationItem
            notificationType="awards"
            title={"Top Chef Awards"}
            description={
              "Weekly recommendations of new and interesting recipes"
            }
          />
        </CardContent>
      </Card>
    </main>
  );
}
