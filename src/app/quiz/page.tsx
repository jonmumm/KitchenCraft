import { getUserActorClient } from "@/lib/auth/session";
import { getUserId } from "@/lib/session";
import { assert } from "@/lib/utils";
import { redirect } from "next/navigation";
import { matchesState } from "xstate";

export const dynamic = "force-dynamic";

export default async function Page() {
  const userActorClient = await getUserActorClient();
  const userId = await getUserId();
  const { snapshot } = await userActorClient.get(userId, {});
  assert(snapshot, "expected snapshot");

  if (matchesState({ Onboarding: "NotStarted" }, snapshot.value)) {
    return redirect("/quiz/intro");
  } else if (
    matchesState({ Onboarding: { Quiz: "Goals" } }, snapshot.value)
  ) {
    return redirect("/quiz/goals");
  } else if (
    matchesState({ Onboarding: { Quiz: "Preferences" } }, snapshot.value)
  ) {
    return redirect("/quiz/preferences");
  } else if (
    matchesState({ Onboarding: { Quiz: "Interests" } }, snapshot.value)
  ) {
    return redirect("/quiz/interests");
  } else if (
    matchesState({ Onboarding: { Quiz: "Intro" } }, snapshot.value)
  ) {
    return redirect("/quiz/intro");
  } else {
    return redirect("/");
  }
}
