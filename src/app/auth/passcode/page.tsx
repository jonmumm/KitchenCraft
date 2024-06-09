import { getNextAuthSession } from "@/lib/auth/session";
import { getBrowser, getUserAgent } from "@/lib/headers";
import { assert } from "@/lib/utils";
import Bowser from "bowser";
import { redirect } from "next/navigation";
import { PasscodeForm } from "./components.client";

export default async function Page({
  searchParams,
}: {
  searchParams: Record<string, string>;
}) {
  const session = await getNextAuthSession();
  if (session) {
    return redirect("/");
  }

  const email = searchParams["email"];
  const callbackUrl = searchParams["callbackUrl"];
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

  const handleSubmit = async (
    email: string,
    callbackUrl: string | undefined,
    formData: FormData
  ) => {
    "use server";
    const token = formData.get("token")?.toString();
    assert(token, "expected token in form body");
    // console.log({ connectionToken });

    // const onCompleteUrl = `/auth/complete?callbackUrl=${callbackUrl}&connectionToken=${connectionToken}`;

    const emailCallbackParams = new URLSearchParams({
      email: email,
      token,
      // callbackUrl,
    });

    // if (callbackUrl) {
    //   // todo might be a problem with this encoding? sometimes seeing errors but not all the time
    //   emailCallbackParams.set("callbackUrl", callbackUrl);
    // }

    // TODO update the caller now...
    // const uniqueId = await getUniqueId();
    // const uniqueIdType = await getUniqueIdType();
    // const url = getRequestUrl();

    // createActorHTTPClient<typeof pageSessionMachine>({
    //   type: "page_session",
    //   caller: {
    //     id: uniqueId,
    //     type: uniqueIdType,
    //   },
    //   input: { url },
    // });
    redirect(`/api/auth/callback/email?${emailCallbackParams.toString()}`);
  };

  return (
    <div className="flex flex-col max-w-2xl mx-auto px-4">
      <section>
        <h1 className="font-semibold text-xl">Check Your Email</h1>
        <PasscodeForm
          // submit={handleSubmit.bind(null, email).bind(null, callbackUrl)}
          email={email}
          gmailLink={gmailLink}
        />
      </section>
    </div>
  );
}
