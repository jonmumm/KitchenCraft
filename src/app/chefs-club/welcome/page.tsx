import { Header } from "@/app/header";
import { db } from "@/db";
import { getStripeCustomerId } from "@/db/queries";
import { getSession } from "@/lib/auth/session";
import { stripe } from "@/lib/stripe";
import { assert } from "@/lib/utils";
import { redirect } from "next/navigation";

export default async function Page() {
  const session = await getSession();
  const userId = session?.user.id;
  const email = session?.user.email;
  if (!userId || !email) {
    return redirect(`/chefs-club`);
  }

  const stripeCustomerId = await getStripeCustomerId(db, userId);
  assert(stripeCustomerId, "expected customer id to be created");

  const customer = await stripe.customers.retrieve(stripeCustomerId);
  console.log({ customer });

  return (
    <>
      <Header />
      <p>Welcome to the club</p>
    </>
  );
}
