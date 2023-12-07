import { headers } from "next/headers";

import { db } from "@/db";
import { getStripeCustomerId } from "@/db/queries";
import { getSession } from "@/lib/auth/session";
import { stripe } from "@/lib/stripe";
import { redirect } from "next/navigation";

export default async function Checkout() {
  const headersList = headers();
    const host = headersList.get("host");
    const protocol =
      host?.startsWith("localhost") || host?.startsWith("127.0.0.1")
        ? `http://`
        : `https://`;
    const origin = `${protocol}${host}`;
  const session = await getSession();
  const userId = session?.user.id;
  const email = session?.user.email;
  if (!userId || !email) {
    return redirect(
      `/auth/signin?callback_url=${encodeURIComponent("/checkout")}`
    );
  }

  const stripeCustomerId = await getStripeCustomerId(db, userId);
  if (!stripeCustomerId) {
    return redirect("/chefs-club");
  }

  const portalSession = await stripe.billingPortal.sessions.create({
    customer: stripeCustomerId,
    return_url: `${origin}`,
  });

  redirect(portalSession.url);
}
