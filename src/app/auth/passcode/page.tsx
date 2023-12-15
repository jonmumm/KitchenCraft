import { getSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { PasscodeForm } from "./components.client";
import { getBrowser, getIsMacDesktop, getUserAgent } from "@/lib/headers";
import { getPlatformInfo } from "@/lib/device";
import { assert } from "@/lib/utils";
import Bowser from "bowser";

export default async function Page({
  searchParams,
}: {
  searchParams: Record<string, string>;
}) {
  const session = await getSession();
  if (session) {
    return redirect("/");
  }

  const email = searchParams["email"];
  assert(email, "expected email");
  const isGmail = email.endsWith("gmail.com");
  const userAgent = getUserAgent();
  const browser = Bowser.getParser(userAgent);
  const isiOSSafari =
    browser.getOSName() === "iOS" && browser.getBrowserName() === "Safari";
  const isDesktop = getBrowser().getPlatformType() === "desktop";
  const showGMailLink = (isiOSSafari || isDesktop) && isGmail;
  const gmailLink = showGMailLink
    ? isDesktop
      ? "https://mail.google.com"
      : "googlegmail://"
    : undefined;

  return (
    <div className="flex flex-col max-w-2xl mx-auto px-4">
      <section>
        <h1 className="font-semibold text-xl">Check Your Email</h1>
        <PasscodeForm email={email} gmailLink={gmailLink} />
      </section>
    </div>
  );
}
