import { SubscriptionsTable, db } from "@/db";
import { findUserByEmail, updateStripeCustomerIdByEmail } from "@/db/queries";
import { privateEnv } from "@/env.secrets";
import { getErrorMessage } from "@/lib/error";
import { stripe } from "@/lib/stripe";
import { assert } from "@/lib/utils";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { z } from "zod";

export const runtime = "edge";

export async function POST(request: NextRequest) {
  const payload = await request.text();
  const sig = z.string().parse(headers().get("stripe-signature"));

  let event;
  try {
    event = await stripe.webhooks.constructEventAsync(
      payload,
      sig,
      privateEnv.STRIPE_WEBHOOK_SECRET
    );

    await handleStripeEvent(event);
  } catch (err) {
    const message = getErrorMessage(err);
    console.error(message);
    return new Response(message, {
      status: 400,
    });
  }

  return NextResponse.json({
    success: true,
  });
}

// todo: type this
const handleStripeEvent = async (event: Stripe.Event) => {
  switch (event.type) {
    case "checkout.session.completed": {
      // Retrieve the session. If you require line items in the response, you may include them by expanding line_items.
      const customerId = event.data.object.customer;
      assert(typeof customerId === "string", "expected customerId");
      const email = event.data.object.customer_email;
      assert(email, "expected email");

      const stripeSubscriptionId = event.data.object.subscription;
      assert(typeof stripeSubscriptionId === "string", "expected subscription");

      // const checkoutId = event.data.object.id;
      // const sessionWithLineItems = await stripe.checkout.sessions.retrieve(
      //   checkoutId,
      //   {
      //     expand: ["line_items"],
      //   }
      // );
      const user = await findUserByEmail(db, email);

      await db.transaction(async (transaction) => {
        await updateStripeCustomerIdByEmail(transaction, email, customerId);

        // Create the subscription
        await transaction.insert(SubscriptionsTable).values({
          userId: user.id,
          stripeSubscriptionId,
          plan: "monthly", // todo pull from line items
          status: "active",
        });
      });
    }
    default:
      // unhandled
      return;
  }
};
