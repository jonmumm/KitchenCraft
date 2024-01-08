/**
 * v0 by Vercel.
 * @see https://v0.dev/t/w6b6P8uJXM3
 */

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/display/card";
import { Label } from "@/components/display/label";
import { Switch } from "@/components/input/switch";
import { getCurrentUserId } from "@/lib/auth/session";
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
      <Card className="w-full max-w-2xl">
        <CardHeader className="pb-8">
          <CardTitle>Notification Settings</CardTitle>
          <CardDescription>
            Customize your notification preferences.
          </CardDescription>
        </CardHeader>
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
