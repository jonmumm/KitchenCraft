import { db } from "@/db";
import { upsertUserFeatureState } from "@/db/queries";
import { FeatureId } from "@/types";
import { ActionSwitch } from "./components.client";
import { NotificationType } from "./constants";
import { revalidatePath } from "next/cache";

export const NotificationSwitch = ({
  notificationType,
  channel,
  distinctId,
  defaultChecked,
}: {
  notificationType: NotificationType;
  channel: "push" | "email";
  distinctId: string;
  defaultChecked: boolean;
}) => {
  async function updateNotificationFeatureState(
    distinctId: string,
    notificationType: string,
    value: boolean
  ) {
    "use server";
    const featureId = `${channel}:${notificationType}` as FeatureId;
    await upsertUserFeatureState(db, distinctId, featureId, value);
    // revalidatePath("/notifications");
    return;
  }

  return (
    <ActionSwitch
      defaultChecked={defaultChecked}
      action={updateNotificationFeatureState
        .bind(null, distinctId)
        .bind(null, notificationType)}
    />
  );
};
