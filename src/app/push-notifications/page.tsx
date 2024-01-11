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
  PushNotificationsDenied,
  PushNotificationsUnprompted,
} from "./components.client";

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
      <h1>Push Notifications</h1>
      <PushNotificationsUnprompted>
        <Link href="/">Skip</Link>{" "}
        {/* TODO: use referrer to say back vs skip */}
        <Button event={{ type: "ENABLE_PUSH_NOTIFICATIONS" }}>
          Enable Pushes
        </Button>
      </PushNotificationsUnprompted>
      <PushNotificationsDenied>
        <></>
        <Button>Go Home</Button>
      </PushNotificationsDenied>
    </PushNotificationProvider>
  );
}
