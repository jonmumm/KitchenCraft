import { getUserActorClient } from "@/lib/auth/session";
import { getUserId } from "@/lib/session";
import { assert } from "@/lib/utils";
import { redirect } from "next/navigation";
import { matchesState } from "xstate";

export const dynamic = "force-dynamic";

export default async function Page() {
  // to get session snapshot here and then redirect accordingly....

  const userActorClient = await getUserActorClient();
  const userId = await getUserId();
  const { snapshot } = await userActorClient.get(userId, {});
  assert(snapshot, "expected snapshot");

  if (matchesState({ Onboarding: "Experience" }, snapshot.value)) {
    return redirect("/quiz/experience");
  } else if (matchesState({ Onboarding: "Preferences" }, snapshot.value)) {
    return redirect("/quiz/preferences");
  } else if (matchesState({ Onboarding: "Summary" }, snapshot.value)) {
    return redirect("/quiz/summary");
  } else {
    return redirect("/quiz/intro");
  }
}
