import { EllipsisAnimation } from "@/components/feedback/ellipsis-animation";
import ServerRedirect from "@/components/navigation/server-redirect";
import { adapter, authOptions, emailConfig } from "@/lib/auth/options";
import { getCurrentEmail } from "@/lib/auth/session";
import { parseAppInstallToken } from "@/lib/session";
import { MAX_INT, parseCookie, setCookie } from "@/lib/coookieStore";
import { createHash, randomString } from "@/lib/string";
import { assert } from "@/lib/utils";
import { randomUUID } from "crypto";
import { redirect } from "next/navigation";

export default async function Page({
  searchParams,
}: {
  searchParams: Record<string, string>;
}) {
  // Usage example
  const appSessionId = parseCookie("appSessionId");
  if (appSessionId) {
    redirect("/");
  }

  const [currentEmail] = await Promise.all([getCurrentEmail()]);
  const { token } = searchParams;
  assert(token, "expected appInstallToken");
  let appInstall;
  try {
    appInstall = await parseAppInstallToken(token);
  } catch (ex) {
    // app install token expired, just go home
    console.warn("app install token expired", appInstall, ex);
    redirect("/");
  }

  // If the app install had an email address and we're not currently logged in
  if (!currentEmail && appInstall.email) {
    const publicToken = randomString(32);
    const secret = emailConfig.secret || authOptions.secret;
    const hashedToken = await createHash(`${publicToken}${secret}`);

    // using createVerificationToken is a
    // hacky way to tell next-auth we're logged in, might be a better way
    // see https://github.com/nextauthjs/next-auth/blob/main/packages/core/src/lib/actions/callback/index.ts#L185
    // for maybe amore direct of just setting the cookie
    const expires = new Date(Date.now() + 300 * 1000);
    await adapter.createVerificationToken?.({
      identifier: appInstall.email,
      token: hashedToken,
      expires,
    });

    const emailCallbackParams = new URLSearchParams({
      email: appInstall.email,
      token: publicToken,
      callbackUrl: `/startup?token=${token}`, // todo might e infinite loop here if auth fails
    });
    redirect(`/api/auth/callback/email?${emailCallbackParams.toString()}`);
  }

  return (
    <>
      <div className="absolute inset-0 flex flex-col gap-2 justify-center items-center">
        <h1 className="font-semibold text-xl text-center">Initializing</h1>
        <EllipsisAnimation />
        <ServerRedirect
          to="/push-notifications"
          onBeforeRedirect={async function () {
            "use server";
            setCookie("appSessionId", randomUUID(), { maxAge: MAX_INT });
          }}
        />
      </div>
    </>
  );
}
