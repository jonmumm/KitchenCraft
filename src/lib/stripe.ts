import Stripe from "stripe";

import { privateEnv } from "@/env.secrets";

function createStripeClient() {
  return new Stripe(privateEnv.STRIPE_SECRET_KEY, {
    //   appInfo: { // For sample support and debugging, not required for production:
    //     name: "stripe-samples/stripe-node-cloudflare-worker-template",
    //     version: "0.0.1",
    //     url: "https://github.com/stripe-samples"
    //   }
  });
}

export const stripe = createStripeClient();

export const webCrypto = Stripe.createSubtleCryptoProvider();
