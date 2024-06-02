import { getBrowserSessionActorClient } from "@/lib/auth/session";
import { getBrowserSessionId } from "@/lib/browser-session";
import { assert } from "@/lib/utils";
import { QuizBanner } from "./components";

export const dynamic = "force-dynamic";

export default async function Page() {
  const browserSessionActorClient = await getBrowserSessionActorClient();
  const browserSessionId = await getBrowserSessionId();
  const { snapshot } = await browserSessionActorClient.get(
    browserSessionId,
    {}
  );
  assert(snapshot, "expected snapshot");

  const show = snapshot.value.Onboarding !== "Summary";
  return <QuizBanner showInitial={show} />;
}
