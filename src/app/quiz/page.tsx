import { getBrowserSessionActorClient } from "@/lib/auth/session";
import { getBrowserSessionId } from "@/lib/browser-session";
import { assert } from "@/lib/utils";
import { redirect } from "next/navigation";

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

  switch (snapshot.value.Onboarding) {
    case "Taste":
      return redirect("/quiz/taste");
    case "Experience":
      return redirect("/quiz/experience");
    case "Diet":
      return redirect("/quiz/diet");
    case "Equipment":
      return redirect("/quiz/equipment");
    default:
      return redirect("/quiz/welcome");
  }
}
