import { Card } from "@/components/display/card";
import { SignInForm } from "@/components/forms/sign-in/components.client";
import { getProfileByUserId } from "@/db/queries";
import { getCurrentUserId } from "@/lib/auth/session";
import { getBrowserSessionId } from "@/lib/browser-session";
import { kv } from "@vercel/kv";
import { redirect } from "next/navigation";

export default async function Page() {
  const currentUserId = await getCurrentUserId();
  if (currentUserId) {
    const currentProfile = await getProfileByUserId(currentUserId);
    redirect(`/@${currentProfile?.profileSlug}`);
  }
  const browserSessionId = await getBrowserSessionId();

  const recipeSlugs = await kv.zrange(`session:${browserSessionId}:recipes`, 0, -1, {rev: true});

  return (
    <div className="flex flex-col max-w-2xl mx-auto px-4">
      <section>
        <SignInForm />
      </section>
    </div>
  );
}
