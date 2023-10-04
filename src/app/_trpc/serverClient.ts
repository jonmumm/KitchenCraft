import { appRouter } from "@/server/router";

// todo might be a way to do this without using an http link?
// -- yes, there is, updated
// but this should probably be instantiated per request and served back in a context.
export const serverClient = appRouter.createCaller({
  userId: "",
  sessionId: "",
});
