import { db } from "@/db";
import { updateStripeCustomerIdByEmail } from "@/db/queries";
import { privateEnv } from "@/env.secrets";
import { getErrorMessage } from "@/lib/error";
import { stripe } from "@/lib/stripe";
import { assert } from "@/lib/utils";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
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
const handleStripeEvent = async (event: any) => {
  if (event.type === "checkout.session.completed") {
    // Retrieve the session. If you require line items in the response, you may include them by expanding line_items.
    const checkoutId = event.data.object.id;
    const sessionWithLineItems = await stripe.checkout.sessions.retrieve(
      checkoutId,
      {
        expand: ["line_items"],
      }
    );

    // todo capture some the stripe customer id and anything else relevant
    assert(
      typeof sessionWithLineItems.customer === "string",
      "expected customerId"
    );
    assert(
      typeof sessionWithLineItems.customer_email === "string",
      "expected customerEmail"
    );
    updateStripeCustomerIdByEmail(
      db,
      sessionWithLineItems.customer_email,
      sessionWithLineItems.customer
    );
    console.log({ sessionWithLineItems }, sessionWithLineItems.customer);
    // const lineItems = sessionWithLineItems.line_items;

    // // Fulfill the purchase...
    // fulfillOrder(lineItems);
  }
};
