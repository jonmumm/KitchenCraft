import { env } from "@/env.public";
import { PostHog } from "posthog-node";

export const posthog = new PostHog(
  env.POSTHOG_CLIENT_KEY
  // { host: '<ph_instance_address>' } // You can omit this line if using PostHog Cloud
);

// await client.shutdownAsync(); // TIP: On program exit, call shutdown to stop pending pollers and flush any remaining events
