import { adapter, authOptions, emailConfig } from "@/lib/auth/options";
import { getCurrentEmail } from "@/lib/auth/session";
import { parseAppInstallToken } from "@/lib/browser-session";
import { pushPermissionCookie } from "@/lib/coookieStore";
import { createHash, randomString } from "@/lib/string";
import { assert } from "@/lib/utils";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default async function Page({
  searchParams,
}: {
  searchParams: Record<string, string>;
}) {
  const [currentEmail] = await Promise.all([getCurrentEmail()]);
  const permissionState = pushPermissionCookie.get();
  const nextPage = permissionState === "granted" ? "/" : "/push-notifications";
  // todo ensure it's not expired

  // If logged in, go home
  if (currentEmail) {
    redirect(nextPage);
  }

  const { token } = searchParams;
  assert(token, "expected appInstallToken");
  let appInstall;
  try {
    appInstall = await parseAppInstallToken(token);
  } catch (ex) {
    redirect(nextPage);
  }

  // If the app install had an email address and we're not currently logged in
  if (appInstall.email) {
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
      callbackUrl: nextPage,
    });

    redirect(`/api/auth/callback/email?${emailCallbackParams.toString()}`);
  }

  redirect(nextPage);
}
