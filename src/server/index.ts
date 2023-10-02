import { z } from "zod";

import { publicProcedure, router } from "./trpc";

export const appRouter = router({
  getData: publicProcedure.query(async () => {
    // Here you would fetch data from a database in a
    // real-life application.
    console.log("getData");
    return "getData";
  }),
  setData: publicProcedure.input(z.string()).mutation(async ({ input }) => {
    // Here you would update a database using the
    // input string passed into the procedure
    console.log(input);
    return input;
  }),
});

// This type will be used as a reference later...
export type AppRouter = typeof appRouter;
