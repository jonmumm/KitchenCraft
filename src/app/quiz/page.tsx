import { getBrowserSessionActorClient } from "@/lib/auth/session";
import { getBrowserSessionId } from "@/lib/browser-session";
import { assert } from "@/lib/utils";
import { redirect } from "next/navigation";
import { matchesState } from "xstate";

export const dynamic = "force-dynamic";

export default async function Page() {
  // to get session snapshot here and then redirect accordingly....

  const browserSessionActorClient = await getBrowserSessionActorClient();
  const browserSessionId = await getBrowserSessionId();
  const { snapshot } = await browserSessionActorClient.get(
    browserSessionId,
    {}
  );
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
