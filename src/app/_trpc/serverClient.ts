import { appRouter } from "@/server";
import { httpBatchLink } from "@trpc/client";
import { trpcUrl } from ".";

// todo might be a way to do this without using an http link?
export const serverClient = appRouter.createCaller({
  links: [
    httpBatchLink({
      url: trpcUrl,
    }),
  ],
});
