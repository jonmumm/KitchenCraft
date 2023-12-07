import { headers } from "next/headers";

const STANDARD_QUARTERLY_PRICE_ID = "price_1OKlsLDPbNvN9DpQlFWKDpNZ";

import { db } from "@/db";
import { getStripeCustomerId } from "@/db/queries";
import { getSession } from "@/lib/auth/session";
import { stripe } from "@/lib/stripe";
import { assert } from "@/lib/utils";
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
  const customer = stripeCustomerId
    ? { customer: stripeCustomerId }
    : { customer_email: email };

  const checkoutSession = await stripe.checkout.sessions.create({
    ...customer,
    line_items: [
      {
        // Provide the exact Price ID (for example, pr_1234) of the product you want to sell
        price: STANDARD_QUARTERLY_PRICE_ID,
        quantity: 1,
      },
    ],
    mode: "subscription",
    success_url: `${origin}/chefs-club/welcome`,
    cancel_url: `${origin}/chefs-club`,
    automatic_tax: { enabled: true },
  });
  assert(checkoutSession.url, "expected checkout session");
  redirect(checkoutSession.url);
}
