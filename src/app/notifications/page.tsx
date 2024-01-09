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
import { getCurrentUserId } from "@/lib/auth/session";
import { getCanInstallPWA } from "@/lib/headers";
import Image from "next/image";
import { redirect } from "next/navigation";

export default async function Page() {
  const currentUserId = await getCurrentUserId();
  if (!currentUserId) {
    redirect(
      `/auth/signin?callbackUrl=${encodeURIComponent(`/notifications`)}`
    );
  }

  return (
    <main className="flex flex-col items-center justify-center h-full p-4 md:p-8">
      <Card className="w-full max-w-2xl flex flex-col">
        <CardHeader>
          <CardTitle>Notification Settings</CardTitle>
          <CardDescription>
            Customize your notification preferences.
          </CardDescription>
        </CardHeader>
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
