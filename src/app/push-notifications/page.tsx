import { Card } from "@/components/display/card";
import { EllipsisAnimation } from "@/components/feedback/ellipsis-animation";
import { Button } from "@/components/input/button";
import { PushSubscriptions, db } from "@/db";
import { getProfileByUserId } from "@/db/queries";
import { env } from "@/env.public";
import { privateEnv } from "@/env.secrets";
import { getDistinctId } from "@/lib/auth/session";
import { assert } from "@/lib/utils";
import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import * as webpush from "web-push";
import {
  PushNotificationProvider,
  PushNotificationStateLoading,
  PushNotificationsDenied,
  PushNotificationsUnprompted,
} from "./components.client";
import { Loader2Icon } from "lucide-react";

export default async function Page() {
  //   const cookieStore = cookies();
  //   cookieStore.set("lastPushPrompt", new Date().toISOString());

  const distinctId = await getDistinctId();

  // we might not need to do this at all
  async function refreshPushSubscription(
    distinctId: string,
    subscription: PushSubscriptionJSON
  ): Promise<void> {
    "use server";
    const cookieStore = cookies();
    cookieStore.set("permissionState", "granted");

    redirect("/");
  }

  async function registerPushSubscription(
    distinctId: string,
    subscription: PushSubscriptionJSON
  ): Promise<void> {
    "use server";

    const cookieStore = cookies();
    cookieStore.set("permissionState", "granted");

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

    const profile = await getProfileByUserId(distinctId);
    const title = profile
      ? `Welcome in, ${profile.profileSlug}!`
      : `Welcome in!`;

    await webpush.sendNotification(
      {
        endpoint,
        keys: {
          auth,
          p256dh,
        },
      },
      JSON.stringify({ title }),
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
    <PushNotificationProvider
      registerPushSubscription={registerPushSubscription.bind(null, distinctId)}
      refreshPushSubscription={refreshPushSubscription.bind(null, distinctId)}
    >
      <div className="absolute inset-0 flex items-center justify-center">
        <Link href="/" className="absolute right-4 top-4 text-muted-foreground">
          <Button variant="ghost">Skip</Button>
        </Link>
        <Card className="max-w-3-xl p-4">
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

          <PushNotificationStateLoading>
            <Button className="w-full" disabled>
              Loading
              <Loader2Icon size={18} className="animate-spin ml-2" />
            </Button>
          </PushNotificationStateLoading>
          <PushNotificationsUnprompted>
            <Button
              event={{ type: "ENABLE_PUSH_NOTIFICATIONS" }}
              className="w-full"
            >
              Enable Push Notifications
            </Button>
          </PushNotificationsUnprompted>
          <PushNotificationsDenied>
            <></>
            <Button>Go Home</Button>
          </PushNotificationsDenied>
        </Card>
      </div>
    </PushNotificationProvider>
  );
}
