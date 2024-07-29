import { headers } from "next/headers";

import { db } from "@/db";
import { getStripeCustomerId } from "@/db/queries";
import { getUserActorClient } from "@/lib/auth/session";
import { getUserId } from "@/lib/session";
// import { getNextAuthSession } from "@/lib/auth/session";
import { stripe } from "@/lib/stripe";
import { assert } from "@/lib/utils";
import { PlanSchema } from "@/schema";
import { redirect } from "next/navigation";

const STANDARD_QUARTERLY_PRICE_ID = "price_1OKlsLDPbNvN9DpQlFWKDpNZ";
const STANDARD_MONTHLY_PRICE_ID = "price_1OKltODPbNvN9DpQWYkfHL4L";
const STANDARD_ANNUAL_PRICE_ID = "price_1OKlu0DPbNvN9DpQvSh9vq39";

const priceIdByPlan = {
  quarterly: STANDARD_QUARTERLY_PRICE_ID,
  monthly: STANDARD_MONTHLY_PRICE_ID,
  annual: STANDARD_ANNUAL_PRICE_ID,
} as const;

const trialPeriodByPlan = {
  quarterly: 14,
  monthly: 7,
  annual: 30,
} as const;

export default async function Checkout(props: {
  searchParams: Record<string, string>;
}) {
  const plan = PlanSchema.parse(props.searchParams["plan"]);
  const priceId = priceIdByPlan[plan];

  const headersList = headers();
  const host = headersList.get("host");
  const protocol =
    host?.startsWith("localhost") || host?.startsWith("127.0.0.1")
      ? `http://`
      : `https://`;
  const origin = `${protocol}${host}`;

  const userActorClient = await getUserActorClient();
  const userId = await getUserId();
  const { snapshot } = await userActorClient.get(userId, {});
  const { email } = snapshot.context;
  if (!email) {
    return redirect(
      `/?error=${encodeURIComponent(
        "Expected to be have email set when checking out"
      )}`
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
        price: priceId,
        quantity: 1,
      },
    ],
    subscription_data: {
      trial_period_days: trialPeriodByPlan[plan],
    },
    mode: "subscription",
    success_url: `${origin}/chefs-club/welcome`,
    cancel_url: `${origin}/chefs-club`,
    automatic_tax: { enabled: true },
  });
  assert(checkoutSession.url, "expected checkout session");
  redirect(checkoutSession.url);
}
