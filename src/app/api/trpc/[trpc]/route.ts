import { appRouter } from "@/server/router";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";

// todo handle auth here...
// parse the auth header for userId and sessionId
const handler = (req: Request) =>
  fetchRequestHandler({
    endpoint: "/api/trpc",
    req,
    router: appRouter,
    createContext: () => ({
      userId: "",
      sessionId: "",
    }),
  });

export { handler as GET, handler as POST };
